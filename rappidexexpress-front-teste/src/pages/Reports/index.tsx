/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext, useEffect, useState } from "react";
import {
  DownloadSimple,
  FilePdf,
  PencilSimple,
  WhatsappLogo,
} from "phosphor-react";

import {
  Container,
  ContainerInfo,
  ContainerOrder,
  ContainerShopkeeper,
  DataContainer,
  Delivery,
  Filter,
  FiltersContainer,
  ProfileImageContainer,
  ReportsContainer,
  SearchButton,
  ShopkeeperInfo,
  ShopkeeperProfileImage,
  EditContainer,
  OnClickLink,
  PageHeader,
  ActionBar,
  ActionButton,
  SettlementSummary,
} from "./styles";
import api from "../../services/api";
import { DeliveryContext } from "../../context/DeliveryContext";
import { City, User, Report } from "../../shared/interfaces";
import { Loader } from "../../components/Loader";

export function Reports() {
  const { token, permission } = useContext(DeliveryContext);
  api.defaults.headers.Authorization = `Bearer ${token}`;

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loading, setLoading] = useState(false);

  const [motoboys, setMotoboys] = useState([]);
  const [shopkeepers, setShopkeepers] = useState<User[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const [reports, setReports] = useState<Report[]>([]);
  const [reportsCount, setReportsCount] = useState(0);

  const [loadingMoreReports, setLoadingMoreReports] = useState(false);
  const [settlementLoading, setSettlementLoading] = useState(false);
  const [page, setPage] = useState(2);

  const [selectedStatus, setSelectedStatus] = useState("FINALIZADO");
  const [selectedMotoboy, setSelectedMotoboy] = useState("");
  const [selectedEstablishment, setSelectedEstablishment] = useState("");
  const [createdIn, setCreatedIn] = useState("");
  const [createdUntil, setCreatedUntil] = useState("");

  const isAdminUser = permission === "admin" || permission === "superadmin";

  function formatNumber(number: string) {
    const cleaned = ("" + number).replace(/\D/g, "");
    const match = cleaned.match(/^(\d{2})(\d{2})(\d{4}|\d{5})(\d{4})$/);

    if (match) {
      return ["(", match[2], ")", match[3], "-", match[4]].join("");
    }
    return "";
  }

  async function onClickSearch() {
    if (loading) {
      return;
    }

    setLoading(true);

    let param = "";
    if (selectedMotoboy) {
      param = `${param}&motoboyId=${selectedMotoboy}`;
    }
    if (selectedEstablishment) {
      param = `${param}&establishmentId=${selectedEstablishment}`;
    }
    if (createdIn) {
      param = `${param}&createdIn=${createdIn}T00:00:00.000Z`;
    }
    if (createdUntil) {
      param = `${param}&createdUntil=${createdUntil}T23:59:59.000Z`;
    }

    try {
      const response = await api.get(
        `/delivery?status=${selectedStatus}&itemsPerPage=50${param}`,
      );
      setReports(response.data.data);
      setPage(2);
      setReportsCount(response.data.count);
      setLoading(false);
    } catch (error: any) {
      alert(error.response.data.message);
      setLoading(false);
    }
  }

  async function getData() {
    try {
      const motoboysResponse = await api.get("/user?type=motoboy");
      const shopkeepersResponse = await api.get("/user?type=shopkeeper");
      const citiesResponse = await api.get("/city");

      setMotoboys(motoboysResponse.data.data);
      setShopkeepers(shopkeepersResponse.data.data);
      setCities(
        Array.isArray(citiesResponse.data?.data)
          ? citiesResponse.data.data
          : citiesResponse.data,
      );
      setLoadingInitial(false);
    } catch (error: any) {
      alert(error.response.data.message);
    }
  }

  async function moreReports() {
    if (loadingMoreReports) {
      return;
    }

    setLoadingMoreReports(true);

    let param = "";
    if (selectedMotoboy) {
      param = `${param}&motoboyId=${selectedMotoboy}`;
    }
    if (selectedEstablishment) {
      param = `${param}&establishmentId=${selectedEstablishment}`;
    }
    if (createdIn) {
      param = `${param}&createdIn=${createdIn}T00:00:00.000Z`;
    }
    if (createdUntil) {
      param = `${param}&createdUntil=${createdUntil}T23:59:59.000Z`;
    }

    try {
      const response = await api.get(
        `/delivery?status=${selectedStatus}&page=${page}&itemsPerPage=50${param}`,
      );
      setReports([...reports, ...response.data.data]);
      setPage(page + 1);
      setLoadingMoreReports(false);
    } catch (error: any) {
      alert(error.response.data.message);
      setLoadingMoreReports(false);
    }
  }

  function getDate(date: string) {
    const dateArray = date.split("T")[0].split("-");
    return `${dateArray[2]}/${dateArray[1]}/${dateArray[0]}`;
  }

  function getHours(date: string) {
    return date.split("T")[1].substring(0, 5);
  }

  function extractIfoodOrderNumber(observation?: string) {
    if (!observation) return null;

    const match = observation.match(
      /Pedido\s*(?:do\s*)?iFood(?:\s*(?:n[ºo°.]|n[uú]mero))?\s*[:#-]?\s*([A-Za-z0-9-]+)/i,
    );

    return match?.[1] || null;
  }

  function getObservation(report: Report) {
    const originalObservation = report.observation?.trim() || "";

    const isIfoodOrder = Boolean(
      report.isIfoodOrder ||
      report.ifoodDisplayId ||
      report.ifoodOrderId ||
      originalObservation.includes("Pedido iFood"),
    );

    if (!isIfoodOrder) {
      return originalObservation;
    }

    const oldObservationWasOverwritten =
      originalObservation.toLowerCase() === "sem observação." ||
      originalObservation.toLowerCase() === "sem observação" ||
      originalObservation.includes("Pedido iFood importado automaticamente");

    const orderNumber =
      report.ifoodDisplayId ||
      report.ifoodOrderId ||
      extractIfoodOrderNumber(originalObservation) ||
      "não informado";

    const addressParts = [
      report.clientAddress,
      report.addressNeighborhood
        ? `Bairro: ${report.addressNeighborhood}`
        : null,
      [report.addressCity, report.addressState].filter(Boolean).join("/") ||
        null,
      report.addressZipCode ? `CEP: ${report.addressZipCode}` : null,
    ].filter(Boolean);

    const addressText = addressParts.join(" | ");

    const parts = [
      `Pedido iFood #${orderNumber}`,
      report.ifoodMerchantName || report.ifoodMerchantId
        ? `Loja iFood: ${report.ifoodMerchantName || report.ifoodMerchantId}`
        : null,
      addressText ? `Endereço: ${addressText}` : null,
      report.addressMapsUrl ? `Localização: ${report.addressMapsUrl}` : null,
      !oldObservationWasOverwritten && originalObservation
        ? originalObservation
        : null,
      report.destinationObservation
        ? `Observação destino: ${report.destinationObservation}`
        : report.destinationObservationConfirmed
          ? "Observação destino: Sem observação."
          : null,
    ].filter(Boolean);

    return parts.join(" | ");
  }

  function normalizeText(value?: string) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }

  function sanitizeWhatsapp(phone?: string) {
    const onlyDigits = String(phone ?? "").replace(/\D/g, "");
    if (!onlyDigits) return "";
    return onlyDigits.startsWith("55") ? onlyDigits : `55${onlyDigits}`;
  }

  function parseCurrency(value?: string) {
    const sanitized = String(value ?? "").replace(/[^\d,.-]/g, "");
    const normalized = sanitized.includes(",")
      ? sanitized.replace(/\./g, "").replace(",", ".")
      : sanitized;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatCurrency(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatDeliveryValueForMessage(value: number) {
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function escapeHtml(value?: string | number) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getPeriodLabel() {
    const start = createdIn
      ? getDate(`${createdIn}T00:00:00.000Z`)
      : "início não informado";
    const end = createdUntil
      ? getDate(`${createdUntil}T00:00:00.000Z`)
      : "fim não informado";
    return `${start} até ${end}`;
  }

  function resolveCityForReport(report: Report) {
    const deliveryCityName = normalizeText(report.addressCity);
    const deliveryCityState = normalizeText(report.addressState);

    if (deliveryCityName) {
      const cityByDelivery = cities.find((city) => {
        const sameName = normalizeText(city.name) === deliveryCityName;
        const sameState =
          !deliveryCityState || normalizeText(city.state) === deliveryCityState;
        return sameName && sameState;
      });

      if (cityByDelivery) return cityByDelivery;
    }

    if (report.establishmentCityId) {
      const cityByEstablishment = cities.find(
        (city) => String(city.id) === String(report.establishmentCityId),
      );
      if (cityByEstablishment) return cityByEstablishment;
    }

    const shopkeeper = shopkeepers.find(
      (item) => item.id === report.establishmentId,
    );
    if (shopkeeper?.cityId) {
      return cities.find(
        (city) => String(city.id) === String(shopkeeper.cityId),
      );
    }

    return undefined;
  }

  function getSelectedShopkeeper() {
    return shopkeepers.find(
      (shopkeeper) => shopkeeper.id === selectedEstablishment,
    );
  }

  function buildDeliveryQuery(pageToFetch?: number, itemsPerPage = 100) {
    let param = "";
    if (selectedMotoboy) {
      param = `${param}&motoboyId=${selectedMotoboy}`;
    }
    if (selectedEstablishment) {
      param = `${param}&establishmentId=${selectedEstablishment}`;
    }
    if (createdIn) {
      param = `${param}&createdIn=${createdIn}T00:00:00.000Z`;
    }
    if (createdUntil) {
      param = `${param}&createdUntil=${createdUntil}T23:59:59.000Z`;
    }
    if (pageToFetch) {
      param = `${param}&page=${pageToFetch}`;
    }

    return `/delivery?status=${selectedStatus}&itemsPerPage=${itemsPerPage}${param}`;
  }

  async function fetchAllSettlementReports() {
    const firstResponse = await api.get(buildDeliveryQuery(1, 100));
    const firstData = Array.isArray(firstResponse.data?.data)
      ? firstResponse.data.data
      : [];
    const totalCount = Number(firstResponse.data?.count ?? firstData.length);
    const allReports: Report[] = [...firstData];
    const totalPages = Math.ceil(totalCount / 100);

    for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
      const response = await api.get(buildDeliveryQuery(currentPage, 100));
      const pageData = Array.isArray(response.data?.data)
        ? response.data.data
        : [];
      allReports.push(...pageData);
    }

    setReports(allReports);
    setReportsCount(totalCount);
    setPage(totalPages + 1);

    return allReports;
  }

  function buildSettlement(deliveries: Report[]) {
    if (!selectedEstablishment) {
      throw new Error("Selecione uma empresa/lojista para gerar o fechamento.");
    }

    if (!createdIn || !createdUntil) {
      throw new Error("Informe o período inicial e final do fechamento.");
    }

    if (!deliveries.length) {
      throw new Error(
        "Nenhuma entrega encontrada para os filtros selecionados.",
      );
    }

    const shopkeeper = getSelectedShopkeeper();
    const firstReport = deliveries[0];
    const establishmentName = shopkeeper?.name || firstReport.establishmentName;
    const establishmentPhone =
      shopkeeper?.phone || firstReport.establishmentPhone;
    const whatsapp = sanitizeWhatsapp(establishmentPhone);

    if (!whatsapp) {
      throw new Error("Este lojista não possui WhatsApp cadastrado no perfil.");
    }

    const deliveryDetails = deliveries.map((delivery) => {
      const city = resolveCityForReport(delivery);
      const deliveryValue = parseCurrency(city?.deliveryValue);

      if (!city || !deliveryValue) {
        throw new Error("Valor da entrega não configurado para esta cidade.");
      }

      return {
        delivery,
        city,
        deliveryValue,
      };
    });

    const city = deliveryDetails[0].city;
    const sameDeliveryValue = deliveryDetails.every(
      (item) => item.deliveryValue === deliveryDetails[0].deliveryValue,
    );
    const total = deliveryDetails.reduce(
      (sum, item) => sum + item.deliveryValue,
      0,
    );

    return {
      establishmentName,
      establishmentPhone,
      whatsapp,
      cityLabel: `${city.name}${city.state ? ` - ${city.state}` : ""}`,
      periodLabel: getPeriodLabel(),
      generatedAt: new Date().toLocaleString("pt-BR"),
      quantity: deliveries.length,
      deliveryValueLabel: sameDeliveryValue
        ? formatCurrency(deliveryDetails[0].deliveryValue)
        : "Valor variável por cidade",
      deliveryValueForMessage: sameDeliveryValue
        ? formatDeliveryValueForMessage(deliveryDetails[0].deliveryValue)
        : "variável por cidade",
      total,
      totalLabel: formatCurrency(total),
      pix: shopkeeper?.pix || firstReport.establishmentPix || "",
      deliveries,
    };
  }

  function buildWhatsappMessage(
    settlement: ReturnType<typeof buildSettlement>,
  ) {
    return `Olá, ${settlement.establishmentName}!\n\nSegue o fechamento das entregas realizadas pela Rappidex Express.\n\nPeríodo: ${settlement.periodLabel}\nQuantidade de entregas: ${settlement.quantity}\nValor por entrega: R$ ${settlement.deliveryValueForMessage}\nTotal a pagar: ${settlement.totalLabel}\n\nO relatório em PDF está em anexo.\n\nObrigado pela parceria!\nRappidex Express`;
  }

  function openSettlementPdf(settlement: ReturnType<typeof buildSettlement>) {
    const deliveriesRows = settlement.deliveries
      .map(
        (delivery) => `
            <tr>
                <td>Pedido #${escapeHtml(delivery.ifoodDisplayId || delivery.ifoodOrderId || delivery.id)}</td>
                <td>${escapeHtml(delivery.clientName)}</td>
                <td>${escapeHtml(delivery.value ? `R$ ${delivery.value}` : "Não informado")}</td>
                <td>${escapeHtml(delivery.status)}</td>
            </tr>
        `,
      )
      .join("");

    const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Fechamento ${escapeHtml(settlement.establishmentName)}</title>
<style>
    body { font-family: Arial, sans-serif; color: #1f2937; margin: 32px; }
    header { border-bottom: 3px solid #00b37e; margin-bottom: 24px; padding-bottom: 16px; }
    h1 { margin: 0; color: #00b37e; }
    h2 { margin: 8px 0 0; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 20px 0; }
    .card { border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; }
    .label { color: #6b7280; font-size: 12px; text-transform: uppercase; }
    .value { font-size: 18px; font-weight: 700; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 13px; }
    th { background: #f3f4f6; }
    @media print { body { margin: 18px; } }
</style>
</head>
<body>
<header>
    <h1>Rappidex Express</h1>
    <h2>Relatório de Fechamento Financeiro</h2>
</header>
<section>
    <p><strong>Empresa:</strong> ${escapeHtml(settlement.establishmentName)}</p>
    <p><strong>Cidade:</strong> ${escapeHtml(settlement.cityLabel)}</p>
    <p><strong>WhatsApp:</strong> ${escapeHtml(formatNumber(settlement.whatsapp))}</p>
    <p><strong>Período:</strong> ${escapeHtml(settlement.periodLabel)}</p>
    <p><strong>Data de geração:</strong> ${escapeHtml(settlement.generatedAt)}</p>
    ${settlement.pix ? `<p><strong>Chave PIX:</strong> ${escapeHtml(settlement.pix)}</p>` : ""}
</section>
<section class="grid">
    <div class="card"><div class="label">Quantidade de entregas</div><div class="value">${settlement.quantity}</div></div>
    <div class="card"><div class="label">Valor por entrega da cidade</div><div class="value">${escapeHtml(settlement.deliveryValueLabel)}</div></div>
    <div class="card"><div class="label">Total a pagar</div><div class="value">${escapeHtml(settlement.totalLabel)}</div></div>
</section>
<h2>Entregas</h2>
<table>
    <thead><tr><th>Pedido</th><th>Cliente</th><th>Valor</th><th>Status</th></tr></thead>
    <tbody>${deliveriesRows}</tbody>
</table>
<script>window.onload = () => window.print();</script>
</body>
</html>`;

    const pdfWindow = window.open("", "_blank");
    if (!pdfWindow) {
      throw new Error(
        "Não foi possível abrir o PDF. Verifique o bloqueador de pop-ups do navegador.",
      );
    }

    pdfWindow.document.write(html);
    pdfWindow.document.close();
  }

  function saveSettlementHistory(
    settlement: ReturnType<typeof buildSettlement>,
    status: "enviado" | "erro" | "pendente",
  ) {
    const history = JSON.parse(
      localStorage.getItem("rappidex:settlement-history") || "[]",
    );
    history.unshift({
      establishmentName: settlement.establishmentName,
      period: settlement.periodLabel,
      quantity: settlement.quantity,
      total: settlement.total,
      whatsapp: settlement.whatsapp,
      sentAt: new Date().toISOString(),
      status,
    });
    localStorage.setItem(
      "rappidex:settlement-history",
      JSON.stringify(history.slice(0, 50)),
    );
  }

  async function prepareSettlement() {
    if (settlementLoading) return null;

    setSettlementLoading(true);
    try {
      const allReports = await fetchAllSettlementReports();
      return buildSettlement(allReports);
    } finally {
      setSettlementLoading(false);
    }
  }

  async function handleGeneratePdf() {
    try {
      const settlement = await prepareSettlement();
      if (!settlement) return;
      openSettlementPdf(settlement);
    } catch (error: any) {
      alert(error?.message ?? "Não foi possível gerar o PDF do fechamento.");
    }
  }

  async function handleSendWhatsapp() {
    try {
      const settlement = await prepareSettlement();
      if (!settlement) return;
      const message = buildWhatsappMessage(settlement);
      window.open(
        `https://wa.me/${settlement.whatsapp}?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer",
      );
      saveSettlementHistory(settlement, "pendente");
      alert(
        "WhatsApp aberto com a mensagem pronta. Como não há API de WhatsApp configurada, baixe/gerar o PDF e anexe manualmente na conversa.",
      );
    } catch (error: any) {
      alert(error?.message ?? "Não foi possível abrir o WhatsApp do lojista.");
    }
  }

  async function handleGeneratePdfAndSendWhatsapp() {
    try {
      const settlement = await prepareSettlement();
      if (!settlement) return;
      openSettlementPdf(settlement);
      const message = buildWhatsappMessage(settlement);
      window.open(
        `https://wa.me/${settlement.whatsapp}?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer",
      );
      saveSettlementHistory(settlement, "pendente");
      alert(
        "PDF aberto e WhatsApp preparado. Anexe o PDF manualmente até que uma API de WhatsApp esteja configurada.",
      );
    } catch (error: any) {
      alert(
        error?.message ??
          "Não foi possível gerar o fechamento e abrir o WhatsApp.",
      );
    }
  }

  useEffect(() => {
    if (loadingInitial) {
      getData();
    }
  });

  return (
    <Container>
      {!loadingInitial && (
        <PageHeader>
          <h1>Relatórios</h1>
        </PageHeader>
      )}
      {loadingInitial ? (
        <Loader size={40} biggestColor="gray" smallestColor="gray" />
      ) : (
        <FiltersContainer>
          <h2>Filtros</h2>
          <DataContainer>
            <form>
              <label htmlFor="birthday">De:</label>
              <input
                type="date"
                value={createdIn}
                onChange={(e) => setCreatedIn(e.target.value)}
              />{" "}
              <br />
            </form>
          </DataContainer>

          <DataContainer>
            <form>
              <label htmlFor="birthday">Até:</label>
              <input
                disabled={!createdIn}
                type="date"
                min={createdIn}
                value={createdUntil}
                onChange={(e) => setCreatedUntil(e.target.value)}
              />
            </form>
          </DataContainer>

          <Filter>
            <p>Status:</p>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="PENDENTE">PENDENTE</option>
              <option value="ACAMINHO">A CAMINHO</option>
              <option value="COLETADO">COLETADO</option>
              <option value="FINALIZADO">FINALIZADO</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>
          </Filter>

          <Filter>
            <p>Motoboy:</p>
            <select
              value={selectedMotoboy}
              onChange={(e) => setSelectedMotoboy(e.target.value)}
            >
              <option value="">Todos</option>
              {motoboys.map((motoboy: User) => (
                <option key={motoboy.id} value={motoboy.id}>
                  {motoboy.name}
                </option>
              ))}
            </select>
          </Filter>

          <Filter>
            <p>Estabelecimento:</p>
            <select
              value={selectedEstablishment}
              onChange={(e) => setSelectedEstablishment(e.target.value)}
            >
              <option value="">Todos</option>
              {shopkeepers.map((shopkeeper: User) => (
                <option key={shopkeeper.id} value={shopkeeper.id}>
                  {shopkeeper.name}
                </option>
              ))}
            </select>
          </Filter>

          <SearchButton onClick={onClickSearch}>
            {loading ? (
              <Loader size={20} biggestColor="gray" smallestColor="gray" />
            ) : (
              "Buscar"
            )}
          </SearchButton>

          {isAdminUser && (
            <SettlementSummary>
              <strong>Fechamento financeiro</strong>
              <p>
                Selecione um lojista, período e status para gerar o PDF ou
                preparar o envio pelo WhatsApp cadastrado no perfil.
              </p>
              <ActionBar>
                <ActionButton
                  type="button"
                  onClick={handleGeneratePdf}
                  disabled={settlementLoading}
                >
                  {settlementLoading ? (
                    <Loader
                      size={18}
                      biggestColor="gray"
                      smallestColor="gray"
                    />
                  ) : (
                    <FilePdf size={18} />
                  )}
                  Gerar PDF
                </ActionButton>
                <ActionButton
                  type="button"
                  onClick={handleSendWhatsapp}
                  disabled={settlementLoading}
                  $variant="whatsapp"
                >
                  <WhatsappLogo size={18} />
                  Enviar WhatsApp
                </ActionButton>
                <ActionButton
                  type="button"
                  onClick={handleGeneratePdfAndSendWhatsapp}
                  disabled={settlementLoading}
                  $variant="secondary"
                >
                  <DownloadSimple size={18} />
                  Gerar PDF e Enviar WhatsApp
                </ActionButton>
              </ActionBar>
            </SettlementSummary>
          )}
        </FiltersContainer>
      )}
      {!loadingInitial && (
        <ReportsContainer>
          <h3>Quantidade de entregas: {reportsCount}</h3>
          {reports.map((report: Report) => {
            const observation = getObservation(report);

            return (
              <Delivery key={report.id}>
                <ContainerShopkeeper>
                  <ProfileImageContainer>
                    <ShopkeeperProfileImage src={report.establishmentImage} />
                  </ProfileImageContainer>
                  <ShopkeeperInfo>
                    <p>{report.establishmentName}</p>
                    {formatNumber(`+55${report.establishmentPhone}`)}
                  </ShopkeeperInfo>
                </ContainerShopkeeper>
                <ContainerOrder>
                  <p>Status: {report.status}</p>
                  <p>Forma de pagamento: {report.payment}</p>
                  <p>Valor: R$ {report.value}</p>
                  <p>Pix: {report.establishmentPix}</p>
                  <p>Refrigerante: {report.soda}</p>
                  {observation && (
                    <p>
                      <b>Observação: {observation}</b>
                    </p>
                  )}
                </ContainerOrder>

                <ContainerInfo>
                  <p>Cliente: {report.clientName} </p>
                  {/* {formatNumber(`+55${report.clientPhone}`)} */}
                </ContainerInfo>

                <ContainerInfo>
                  <p>Motoboy: {report.motoboyName} </p>
                  {formatNumber(`+55${report.motoboyPhone}`)}
                </ContainerInfo>

                <ContainerInfo>
                  <p>
                    Criado em {getDate(report.createdAt)} as{" "}
                    {getHours(report.createdAt)}
                  </p>
                </ContainerInfo>

                <ContainerInfo>
                  {report.onCoursedAt && (
                    <p>Atribuído: {getHours(report.onCoursedAt)}</p>
                  )}
                  {report.collectedAt && (
                    <p>Coletado: {getHours(report.collectedAt)}</p>
                  )}
                  {report.finishedAt && (
                    <p>Finalizado: {getHours(report.finishedAt)}</p>
                  )}
                </ContainerInfo>

                {(permission === "admin" || permission === "superadmin") && (
                  <EditContainer>
                    <OnClickLink to="/editar-entrega" state={report}>
                      Editar
                      <PencilSimple size={15} />
                    </OnClickLink>
                  </EditContainer>
                )}
              </Delivery>
            );
          })}

          {reports.length < reportsCount && (
            <EditContainer onClick={moreReports}>
              {loadingMoreReports ? (
                <Loader size={15} biggestColor="gray" smallestColor="gray" />
              ) : (
                <OnClickLink to="#">
                  mais... <DownloadSimple size={15} />
                </OnClickLink>
              )}
            </EditContainer>
          )}
        </ReportsContainer>
      )}
    </Container>
  );
}
