/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";

import { DeliveryContext } from "../../context/DeliveryContext";
import api, { SOCKET_URL } from "../../services/api";
import { City, Motoboy, Report } from "../../shared/interfaces";
import { DeliveryCard } from "./components/DeliveryCard";

import {
  BaseButton,
  Container,
  ContainerButtons,
  ContainerDeliveries,
  ContainerLoading,
  Flag,
} from "./styles";
import { Loader } from "../../components/Loader";
import { BaseModal } from "../../components/Modal";
import {
  StatusDelivery,
  UserType,
} from "../../shared/constants/enums.constants";

type DeliveryUpdateData = {
  status?: string;
  motoboyId?: string;
  observation?: string;
  deliveryCode?: string;
};

type DeliveryCountsDelta = {
  pending: number;
  assigned: number;
};

export function Dashboard() {
  const { token, permission } = useContext(DeliveryContext);

  const [status, setStatus] = useState<string>(`${StatusDelivery.PENDING}`);
  const [loading, setLoading] = useState<boolean>(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [motoboys, setMotoboys] = useState<Motoboy[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [assignedCount, setAssignedCount] = useState<number>(0);
  const [updatingDeliveryIds, setUpdatingDeliveryIds] = useState<Set<string>>(
    () => new Set(),
  );

  const [selectedMotoboy, setSelectedMotoboy] = useState<string>("");

  const [currentCityId, setCurrentCityId] = useState<string>("");
  const reloadTimeoutRef = useRef<number | null>(null);
  const refreshRequestIdRef = useRef(0);
  const didFirstLoadRef = useRef(false);

  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [observation, setObservation] = useState<string>("");
  const [reportSelectedToModal, setReportSelectedToModal] =
    useState<string>("");

  useEffect(() => {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }, [token]);

  function handleModal() {
    setIsVisible((state) => !state);
  }

  function getDateValue(date?: string) {
    if (!date) return 0;

    const parsed = new Date(date).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  const sortedReports = useMemo(() => {
    const sortedByCreatedAt = [...reports].sort(
      (a, b) => getDateValue(a.createdAt) - getDateValue(b.createdAt),
    );

    if (permission !== UserType.MOTOBOY) {
      return sortedByCreatedAt;
    }

    const statusPriority: Record<string, number> = {
      [StatusDelivery.ONCOURSE]: 0,
      [StatusDelivery.COLLECTED]: 1,
    };

    return sortedByCreatedAt.sort((a, b) => {
      const priorityA = statusPriority[a.status] ?? 99;
      const priorityB = statusPriority[b.status] ?? 99;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return getDateValue(a.createdAt) - getDateValue(b.createdAt);
    });
  }, [permission, reports]);

  const statusFilterSet = useMemo(() => {
    return new Set(status.split(",").filter(Boolean));
  }, [status]);

  function normalizeDeliveryResponse(payload: any): Report | null {
    if (!payload) return null;

    if (payload.data && typeof payload.data === "object") {
      return payload.data as Report;
    }

    return payload as Report;
  }

  function isInAssigned(statusValue?: string) {
    return (
      statusValue === StatusDelivery.ONCOURSE ||
      statusValue === StatusDelivery.COLLECTED
    );
  }

  function getCountDelta(
    previousStatus?: string,
    nextStatus?: string,
  ): DeliveryCountsDelta {
    return {
      pending:
        (previousStatus === StatusDelivery.PENDING ? -1 : 0) +
        (nextStatus === StatusDelivery.PENDING ? 1 : 0),
      assigned:
        (isInAssigned(previousStatus) ? -1 : 0) +
        (isInAssigned(nextStatus) ? 1 : 0),
    };
  }

  function statusMatchesCurrentFilter(statusValue?: string) {
    if (!statusValue) return false;

    return statusFilterSet.has(statusValue);
  }

  function updateReportInListLocally(updatedReport: Report) {
    setReports((previousReports) => {
      const withUpdate = previousReports.map((item) =>
        item.id === updatedReport.id ? { ...item, ...updatedReport } : item,
      );

      if (!statusMatchesCurrentFilter(updatedReport.status)) {
        return withUpdate.filter((item) => item.id !== updatedReport.id);
      }

      return withUpdate;
    });
  }

  function startUpdatingDelivery(deliveryId: string) {
    setUpdatingDeliveryIds((state) => {
      if (state.has(deliveryId)) {
        return state;
      }

      const nextState = new Set(state);
      nextState.add(deliveryId);
      return nextState;
    });
  }

  function stopUpdatingDelivery(deliveryId: string) {
    setUpdatingDeliveryIds((state) => {
      if (!state.has(deliveryId)) {
        return state;
      }

      const nextState = new Set(state);
      nextState.delete(deliveryId);
      return nextState;
    });
  }

  function isDeliveryUpdating(deliveryId: string) {
    return updatingDeliveryIds.has(deliveryId);
  }

  const refreshDashboard = useCallback(
    async (showLoader = false) => {
      const requestId = ++refreshRequestIdRef.current;

      if (showLoader) {
        setLoading(true);
      }

      try {
        const currentResponse = await api.get(
          `/delivery?status=${status}&includeDashboardCounts=true`,
        );

        if (requestId !== refreshRequestIdRef.current) {
          return;
        }

        const rawReports = Array.isArray(currentResponse.data?.data)
          ? currentResponse.data.data
          : [];
        const hasEmbeddedCounts =
          typeof currentResponse.data?.dashboardCounts?.pending === "number" &&
          typeof currentResponse.data?.dashboardCounts?.assigned === "number";

        let nextPendingCount = Number(
          currentResponse.data?.dashboardCounts?.pending,
        );
        let nextAssignedCount = Number(
          currentResponse.data?.dashboardCounts?.assigned,
        );

        if (!hasEmbeddedCounts) {
          const countsResponse = await api.get("/delivery/counts");
          nextPendingCount = Number(countsResponse.data?.pending) || 0;
          nextAssignedCount = Number(countsResponse.data?.assigned) || 0;
        }

        setReports(rawReports);
        setPendingCount(nextPendingCount || 0);
        setAssignedCount(nextAssignedCount || 0);
      } catch (error: any) {
        if (requestId !== refreshRequestIdRef.current) {
          return;
        }

        alert(error.response?.data?.message || "Erro ao carregar pedidos.");
      } finally {
        if (showLoader && requestId === refreshRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [status],
  );

  const getCities = useCallback(async () => {
    try {
      const response = await api.get("/city");
      const rawData = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];

      setCities(rawData as City[]);
    } catch (error) {
      console.error("Erro ao carregar cidades:", error);
    }
  }, []);

  const getMotoboys = useCallback(async () => {
    if (permission === "shopkeeper") return;

    try {
      const motoboysRes = await api.get("/user/motoboys");
      setMotoboys(motoboysRes.data ?? []);
    } catch (error) {
      console.error("Erro ao carregar motoboys:", error);
    }
  }, [permission]);

  const getMyself = useCallback(async () => {
    try {
      const response = await api.get("/user/myself");
      setCurrentCityId(response.data?.cityId ?? "");
    } catch (error) {
      console.error("Erro ao carregar usuário atual:", error);
    }
  }, []);

  async function handlerNextStep(report: Report) {
    if (isDeliveryUpdating(report.id)) {
      return;
    }

    let data: DeliveryUpdateData | null = null;
    let newStatus = "";

    if (
      report.status === StatusDelivery.COLLECTED &&
      report.id !== reportSelectedToModal
    ) {
      setReportSelectedToModal(report.id);
      handleModal();
      return;
    }

    if (report.status === StatusDelivery.PENDING) {
      if (!selectedMotoboy) {
        alert("Selecione o motoboy");
        return;
      }

      newStatus = StatusDelivery.ONCOURSE;
      data = {
        status: newStatus,
        motoboyId: selectedMotoboy,
      };
    } else if (report.status === StatusDelivery.ONCOURSE) {
      newStatus = StatusDelivery.COLLECTED;
      data = {
        status: newStatus,
      };
    } else if (report.status === StatusDelivery.COLLECTED) {
      newStatus = StatusDelivery.FINISHED;

      const isIfoodOrder = report.observation?.includes("Pedido iFood #");
      let deliveryCode = "";

      if (isIfoodOrder) {
        const codeTyped = window.prompt(
          "Digite o código de entrega do iFood informado pelo cliente:",
        );

        if (codeTyped === null) {
          return;
        }

        deliveryCode = codeTyped.trim();

        if (!deliveryCode) {
          alert("Informe o código de entrega do iFood.");
          return;
        }
      }

      data = {
        status: newStatus,
        observation: observation === "Sem observação." ? "" : observation,
        deliveryCode,
      };
    }

    if (!data || !newStatus) {
      return;
    }

    try {
      startUpdatingDelivery(report.id);
      const response = await api.put(`/delivery/${report.id}`, data);
      const updatedReport = normalizeDeliveryResponse(response.data);

      if (!updatedReport) {
        await refreshDashboard(false);
        alert(`Solicitação avançada para o passo ${newStatus}`);
        return;
      }

      if (
        newStatus === StatusDelivery.ONCOURSE &&
        data.motoboyId &&
        updatedReport.motoboyId &&
        updatedReport.motoboyId !== data.motoboyId
      ) {
        await refreshDashboard(false);
        alert("Essa entrega já foi atribuída a outro entregador.");
        return;
      }

      const delta = getCountDelta(
        report.status,
        updatedReport.status || newStatus,
      );
      setPendingCount((state) => Math.max(0, state + delta.pending));
      setAssignedCount((state) => Math.max(0, state + delta.assigned));
      updateReportInListLocally(updatedReport);
      alert(`Solicitação avançada para o passo ${newStatus}`);
      setObservation("");
      setReportSelectedToModal("");
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao atualizar pedido.");
    } finally {
      stopUpdatingDelivery(report.id);
    }
  }

  async function handlerSave(report: Report) {
    if (isDeliveryUpdating(report.id)) {
      return;
    }

    if (!selectedMotoboy) {
      alert("Selecione o motoboy");
      return;
    }

    try {
      startUpdatingDelivery(report.id);
      const response = await api.put(`/delivery/${report.id}`, {
        motoboyId: selectedMotoboy,
      });

      const updatedReport = normalizeDeliveryResponse(response.data);

      if (updatedReport) {
        updateReportInListLocally(updatedReport);
      } else {
        await refreshDashboard(false);
      }
      alert("Motoboy foi atualizado com sucesso.");
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao salvar motoboy.");
    } finally {
      stopUpdatingDelivery(report.id);
    }
  }

  async function handlerCancel(report: Report) {
    if (isDeliveryUpdating(report.id)) {
      return;
    }

    const confirmMessage = window.confirm(
      "Você realmente deseja apagar essa entrega?",
    );

    if (!confirmMessage) {
      return;
    }

    try {
      startUpdatingDelivery(report.id);
      await api.put(`/delivery/${report.id}`, {
        status: "CANCELADO",
      });

      const delta = getCountDelta(report.status, StatusDelivery.CANCELED);
      setPendingCount((state) => Math.max(0, state + delta.pending));
      setAssignedCount((state) => Math.max(0, state + delta.assigned));
      setReports((state) => state.filter((item) => item.id !== report.id));
      alert("O pedido foi cancelado com sucesso.");
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao cancelar pedido.");
    } finally {
      stopUpdatingDelivery(report.id);
    }
  }

  async function handlerDelete(report: Report) {
    if (isDeliveryUpdating(report.id)) {
      return;
    }

    try {
      startUpdatingDelivery(report.id);
      await api.delete(`/delivery/${report.id}`);

      const delta = getCountDelta(report.status, undefined);
      setPendingCount((state) => Math.max(0, state + delta.pending));
      setAssignedCount((state) => Math.max(0, state + delta.assigned));
      setReports((state) => state.filter((item) => item.id !== report.id));
      alert("Solicitação apagada com sucesso.");
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao apagar pedido.");
    } finally {
      stopUpdatingDelivery(report.id);
    }
  }

  function getButtonText(currentStatus: string, id: string) {
    if (StatusDelivery.PENDING === currentStatus) {
      return "Atribuir";
    }

    if (StatusDelivery.ONCOURSE === currentStatus) {
      return "Coletar";
    }

    if (StatusDelivery.COLLECTED === currentStatus) {
      if (id !== reportSelectedToModal) {
        return "Observação";
      }

      return "Finalizar";
    }

    return "Avançar";
  }

  function formatPhoneNumber(phone: string) {
    const number = `+55${phone}`;
    const cleaned = String(number).replace(/\D/g, "");
    const match = cleaned.match(/^(\d{2})(\d{2})(\d{4}|\d{5})(\d{4})$/);

    if (match) {
      return ["(", match[2], ")", match[3], "-", match[4]].join("");
    }

    return "";
  }

  function getIfoodOrderNumber(observation?: string) {
    if (!observation) {
      return null;
    }

    const match = observation.match(/Pedido iFood\s*#\s*(\d+)/i);

    if (!match) {
      return null;
    }

    return match[1];
  }

  function getHours(date: string) {
    return date.split("T")[1].substring(0, 5);
  }

  function getClientWhatsappMessage(report: Report) {
    if (!report.establishmentCityId) {
      return undefined;
    }

    const city = cities.find(
      (item) => String(item.id) === String(report.establishmentCityId),
    );

    const customMessage = city?.clientWhatsappMessage?.trim();

    return customMessage ? customMessage : undefined;
  }

  useEffect(() => {
    const shouldShowLoader = !didFirstLoadRef.current;

    void refreshDashboard(shouldShowLoader).finally(() => {
      didFirstLoadRef.current = true;
    });
  }, [refreshDashboard]);

  useEffect(() => {
    if (motoboys.length === 1) {
      setSelectedMotoboy(motoboys[0].id);
    }
  }, [motoboys]);

  useEffect(() => {
    void getCities();
  }, [getCities]);

  useEffect(() => {
    void getMotoboys();
  }, [getMotoboys]);

  useEffect(() => {
    if (permission === UserType.SHOPKEEPER) {
      return;
    }

    const motoboysPollingInterval = window.setInterval(() => {
      void getMotoboys();
    }, 30000);

    return () => {
      window.clearInterval(motoboysPollingInterval);
    };
  }, [getMotoboys, permission]);

  useEffect(() => {
    void getMyself();
  }, [getMyself]);

  useEffect(() => {
    if (!currentCityId) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    const reloadDeliveries = () => {
      if (reloadTimeoutRef.current) {
        window.clearTimeout(reloadTimeoutRef.current);
      }

      reloadTimeoutRef.current = window.setTimeout(() => {
        void refreshDashboard(false);
      }, 250);
    };

    socket.on("connect", () => {
      socket.emit("join-city", currentCityId);
    });

    socket.on("delivery:created", reloadDeliveries);
    socket.on("delivery:updated", reloadDeliveries);
    socket.on("delivery:deleted", reloadDeliveries);

    return () => {
      if (reloadTimeoutRef.current) {
        window.clearTimeout(reloadTimeoutRef.current);
      }

      socket.off("delivery:created", reloadDeliveries);
      socket.off("delivery:updated", reloadDeliveries);
      socket.off("delivery:deleted", reloadDeliveries);
      socket.disconnect();
    };
  }, [currentCityId, refreshDashboard]);

  return (
    <Container>
      <BaseModal
        isVisible={isVisible}
        handleClose={handleModal}
        setObservation={setObservation}
      />

      <ContainerButtons>
        <BaseButton
          typeReport={status === StatusDelivery.PENDING}
          onClick={() => setStatus(StatusDelivery.PENDING)}
        >
          Livres
          <Flag>{pendingCount}</Flag>
        </BaseButton>

        <BaseButton
          typeReport={status !== StatusDelivery.PENDING}
          onClick={() =>
            setStatus(`${StatusDelivery.ONCOURSE},${StatusDelivery.COLLECTED}`)
          }
        >
          Atribuídos
          <Flag>{assignedCount}</Flag>
        </BaseButton>
      </ContainerButtons>

      <ContainerDeliveries>
        {loading ? (
          <ContainerLoading>
            <Loader size={40} biggestColor="green" smallestColor="gray" />
          </ContainerLoading>
        ) : (
          <>
            {sortedReports.map((report: Report) => (
              <DeliveryCard
                key={report.id}
                report={report}
                statusFilter={status}
                permission={permission}
                selectedMotoboy={selectedMotoboy}
                motoboys={motoboys}
                isUpdating={isDeliveryUpdating(report.id)}
                onSelectMotoboy={setSelectedMotoboy}
                onSave={handlerSave}
                onCancel={handlerCancel}
                onNextStep={handlerNextStep}
                onDelete={handlerDelete}
                getButtonText={getButtonText}
                getHours={getHours}
                formatPhoneNumber={formatPhoneNumber}
                getIfoodOrderNumber={getIfoodOrderNumber}
                getClientWhatsappMessage={getClientWhatsappMessage}
              />
            ))}
          </>
        )}
      </ContainerDeliveries>
    </Container>
  );
}