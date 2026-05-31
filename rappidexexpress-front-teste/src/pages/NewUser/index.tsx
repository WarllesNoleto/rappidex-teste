/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import * as zod from "zod";
import { useForm } from "react-hook-form";

import { DeliveryContext } from "../../context/DeliveryContext";
import api, { API_URL } from "../../services/api";
import { City } from "../../shared/interfaces";
import {
  BaseInput,
  Container,
  ContainerButtons,
  FormContainer,
  BaseButton,
  BaseInputMask,
  DeleteButton,
  ResetPassButton,
  IntegrationSection,
  HelpText,
  InlineInfo,
  CopyButton,
} from "./styles";
import { Loader } from "../../components/Loader";

const ProfileFormValidationSchema = zod.object({
  name: zod.string().min(5, "Informe o seu nome."),
  phone: zod.string(),
  user: zod.string(),
  password: zod.string(),
  pix: zod.string(),
  profileImage: zod.string(),
  location: zod.string(),
  useIfoodIntegration: zod.boolean().optional(),
  usesExternalIfoodPdv: zod.boolean().optional(),
  ifoodMerchantId: zod.string().optional(),
  anotaAiEnabled: zod.boolean().optional(),
  anotaAiStoreId: zod.string().optional(),
  anotaAiToken: zod.string().optional(),
  anotaAiIgnoreIfoodOrders: zod.boolean().optional(),
});

type IfoodMerchantForm = {
  merchantId: string;
  name: string;
  enabled: boolean;
  pickupAddress?: string;
};
type ProfileFormData = zod.infer<typeof ProfileFormValidationSchema>;

export function NewUser() {
  const { token, permission } = useContext(DeliveryContext);
  api.defaults.headers.Authorization = `Bearer ${token}`;
  const navigate = useNavigate();

  const { user } = useParams();

  const [userId, setUserId] = useState();
  const [formValues, setFormValues] = useState({
    name: "",
    phone: "",
    user: "",
    password: "",
    pix: "",
    profileImage: "",
    location: "",
    useIfoodIntegration: false,
    usesExternalIfoodPdv: false,
    ifoodMerchantId: "",
    anotaAiEnabled: false,
    anotaAiStoreId: "",
    anotaAiToken: "",
    anotaAiIgnoreIfoodOrders: true,
  });
  const [ifoodMerchants, setIfoodMerchants] = useState<IfoodMerchantForm[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingResetPass, setLoadingResetPass] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState("");
  const [loggedUserCityId, setLoggedUserCityId] = useState("");
  const profileFormData = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileFormValidationSchema),
    values: formValues,
  });

  const { handleSubmit, watch, register, reset, setValue } = profileFormData;

  const allowCitySelection = permission === "superadmin";
  const anotaAiWebhookUrl = `${API_URL}/anota-ai/webhook`;

  function resetAnotaAiFields() {
    setValue("anotaAiEnabled", false);
    setValue("anotaAiStoreId", "");
    setValue("anotaAiToken", "");
    setValue("anotaAiIgnoreIfoodOrders", true);
  }

  function buildAnotaAiPayload(data: Partial<ProfileFormData>) {
    const shouldKeepAnotaAi =
      selectedType === "shopkeeper" || selectedType === "shopkeeperadmin";
    const anotaAiEnabled = shouldKeepAnotaAi
      ? Boolean(data.anotaAiEnabled)
      : false;

    return {
      anotaAiEnabled,
      anotaAiStoreId: anotaAiEnabled
        ? String(data.anotaAiStoreId || "").trim()
        : "",
      anotaAiToken: anotaAiEnabled
        ? String(data.anotaAiToken || "").trim()
        : "",
      anotaAiIgnoreIfoodOrders: shouldKeepAnotaAi
        ? data.anotaAiIgnoreIfoodOrders !== false
        : true,
    };
  }

  async function handleCopyCompanyId() {
    if (!userId) {
      return;
    }

    try {
      await navigator.clipboard.writeText(String(userId));
      alert("ID da empresa copiado!");
    } catch {
      alert(`ID da empresa no Rappidex: ${userId}`);
    }
  }

  function resolveLegacyMerchantId(
    merchantId: string,
    merchants: IfoodMerchantForm[] = [],
  ) {
    const normalizedLegacyMerchantId = String(merchantId || "").trim();
    if (normalizedLegacyMerchantId) {
      return normalizedLegacyMerchantId;
    }

    const firstActiveMerchantId = merchants.find(
      (merchant) =>
        merchant?.enabled !== false &&
        String(merchant?.merchantId || "").trim(),
    )?.merchantId;

    return String(firstActiveMerchantId || "").trim();
  }

  async function handleCreate(data: ProfileFormData) {
    if (loading) {
      return;
    }

    setLoading(true);

    if (data.phone.includes("_")) {
      alert("Numero de telefone está faltando algum digito!");
      setLoading(false);
      return;
    }

    const cityIdToSubmit = allowCitySelection
      ? selectedCityId
      : loggedUserCityId;
    const useIfoodIntegration = Boolean(data.useIfoodIntegration);
    const usesExternalIfoodPdv = useIfoodIntegration
      ? Boolean(data.usesExternalIfoodPdv)
      : false;
    const normalizedMerchants = ifoodMerchants
      .map((merchant) => ({
        ...merchant,
        merchantId: String(merchant.merchantId || "").trim(),
        name: String(merchant.name || "").trim(),
        pickupAddress: String(merchant.pickupAddress || "").trim(),
      }))
      .filter((merchant) => merchant.merchantId);
    const ifoodMerchantId = resolveLegacyMerchantId(
      data.ifoodMerchantId || "",
      normalizedMerchants,
    );

    if (
      useIfoodIntegration &&
      !ifoodMerchantId &&
      normalizedMerchants.length === 0
    ) {
      alert("Para integração iFood, preencha o merchantId.");
      setLoading(false);
      return;
    }

    if (!cityIdToSubmit) {
      alert("Não foi possível identificar a cidade para vincular ao usuário.");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/user", {
        ...data,
        phone: formatPhone(data.phone),
        type: selectedType,
        permission:
          selectedType === "admin" || selectedType === "superadmin"
            ? selectedType
            : "none",
        cityId: cityIdToSubmit,
        useIfoodIntegration,
        usesExternalIfoodPdv,
        ifoodMerchantId,
        ifoodMerchants: normalizedMerchants,
        ...buildAnotaAiPayload(data),
      });
      if (useIfoodIntegration && ifoodMerchantId) {
        const createdCompanyId = response?.data?.id;
        if (createdCompanyId) {
          await api
            .post(`/ifood/sync-company/${createdCompanyId}`)
            .catch(() => undefined);
        }
        alert(
          "Integração iFood salva. Os pedidos podem levar até 1 minuto para aparecer após ficarem prontos. Sincronização inicial iniciada.",
        );
      }
      reset();
      setLoading(false);
      alert("Novo usuário criado com sucesso!");
    } catch (error: any) {
      setLoading(false);
      alert(error.response.data.message);
    }
  }

  async function handleSave() {
    if (loading) {
      return;
    }

    setLoading(true);

    const {
      name,
      phone,
      user,
      pix,
      profileImage,
      location,
      useIfoodIntegration,
      ifoodMerchantId,
      usesExternalIfoodPdv,
      anotaAiEnabled,
      anotaAiStoreId,
      anotaAiToken,
      anotaAiIgnoreIfoodOrders,
    } = watch();
    const cityIdToSubmit = allowCitySelection
      ? selectedCityId
      : loggedUserCityId;
    const normalizedMerchants = ifoodMerchants
      .map((merchant) => ({
        ...merchant,
        merchantId: String(merchant.merchantId || "").trim(),
        name: String(merchant.name || "").trim(),
        pickupAddress: String(merchant.pickupAddress || "").trim(),
      }))
      .filter((merchant) => merchant.merchantId);

    if (
      useIfoodIntegration &&
      !(ifoodMerchantId || "").trim() &&
      normalizedMerchants.length === 0
    ) {
      alert("Para integração iFood, preencha o merchantId.");
      setLoading(false);
      return;
    }

    if (!cityIdToSubmit) {
      alert("Não foi possível identificar a cidade para vincular ao usuário.");
      setLoading(false);
      return;
    }
    try {
      await api.put(`/user/${userId}`, {
        name,
        phone: formatPhone(phone),
        user,
        pix,
        profileImage,
        location,
        type: selectedType,
        cityId: cityIdToSubmit,
        useIfoodIntegration: Boolean(useIfoodIntegration),
        usesExternalIfoodPdv:
          Boolean(useIfoodIntegration) && Boolean(usesExternalIfoodPdv),
        ifoodMerchantId: resolveLegacyMerchantId(
          ifoodMerchantId || "",
          normalizedMerchants,
        ),
        ifoodMerchants: normalizedMerchants,
        ...buildAnotaAiPayload({
          anotaAiEnabled,
          anotaAiStoreId,
          anotaAiToken,
          anotaAiIgnoreIfoodOrders,
        }),
      });
      if (
        useIfoodIntegration &&
        resolveLegacyMerchantId(ifoodMerchantId || "", normalizedMerchants)
      ) {
        await api.post(`/ifood/sync-company/${userId}`).catch(() => undefined);
        alert(
          "Integração iFood salva. Os pedidos podem levar até 1 minuto para aparecer após ficarem prontos. Sincronização inicial iniciada.",
        );
      }
      setLoading(false);
      alert("Usuário editado com sucesso!");
    } catch (error: any) {
      setLoading(false);
      alert(error.response.data.message);
    }
  }

  async function handleDelete() {
    if (loadingDelete) {
      return;
    }

    setLoadingDelete(true);

    try {
      await api.delete(`/user/${userId}`);
      setLoadingDelete(false);
      alert("Usuário apagado com sucesso!");
      navigate("/");
    } catch (error: any) {
      setLoading(false);
      alert(error.response.data.message);
    }
  }

  async function handleReset() {
    if (loadingResetPass) {
      return;
    }

    setLoadingResetPass(true);

    try {
      await api.put(`/user/${userId}/reset-password`);
      setLoadingResetPass(false);
      alert("Senha resetada com sucesso!");
    } catch (error: any) {
      setLoading(false);
      alert(error.response.data.message);
    }
  }

  function formatPhone(phone: string) {
    return phone
      .replace("(", "")
      .replace(")", "")
      .replace(" ", "")
      .replace("-", "");
  }

  async function fetchCities() {
    if (!allowCitySelection) {
      setCities([]);
      return;
    }

    setCitiesLoading(true);
    try {
      const response = await api.get("/city");
      const rawData = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];
      setCities(rawData as City[]);
    } catch (error: any) {
      alert(
        error.response?.data?.message ??
          "Não foi possível carregar as cidades.",
      );
    } finally {
      setCitiesLoading(false);
    }
  }

  async function fetchLoggedUserCity() {
    try {
      const response = await api.get("/user/myself");
      const userCityId =
        response.data?.cityId ??
        response.data?.city?.id ??
        response.data?.city?.cityId ??
        "";
      const normalizedCityId = userCityId ? String(userCityId) : "";
      setLoggedUserCityId(normalizedCityId);

      if (!allowCitySelection) {
        setSelectedCityId(normalizedCityId);
      }
    } catch (error: any) {
      alert(
        error.response?.data?.message ??
          "Não foi possível carregar a cidade do usuário logado.",
      );
    }
  }

  async function getUserData() {
    let userFinded;
    try {
      userFinded = await api.get(`/user/${user}`);
      setFormValues({
        ...userFinded.data,
        anotaAiEnabled: Boolean(userFinded.data?.anotaAiEnabled),
        anotaAiStoreId: userFinded.data?.anotaAiStoreId || "",
        anotaAiToken: userFinded.data?.anotaAiToken || "",
        anotaAiIgnoreIfoodOrders:
          userFinded.data?.anotaAiIgnoreIfoodOrders !== false,
      });
      setIfoodMerchants(
        Array.isArray(userFinded.data?.ifoodMerchants)
          ? userFinded.data.ifoodMerchants
          : [],
      );
      setUserId(userFinded.data.id);
      setSelectedType(userFinded.data.type);
      const cityIdFromUser =
        userFinded.data?.cityId ??
        userFinded.data?.city?.id ??
        userFinded.data?.city?.cityId ??
        "";
      const normalizedCityIdFromUser = cityIdFromUser
        ? String(cityIdFromUser)
        : "";

      if (allowCitySelection) {
        setSelectedCityId(normalizedCityIdFromUser);
      }
    } catch (error: any) {
      setLoading(false);
      alert(error.response.data.message);
    }
  }

  const name = watch("name");
  const phone = watch("phone");
  const pix = watch("pix");
  const profileImage = watch("profileImage");
  const useIfoodIntegration = watch("useIfoodIntegration");
  const anotaAiEnabled = watch("anotaAiEnabled");
  // const location = watch('location')
  const citySelectionMissing = allowCitySelection
    ? !selectedCityId
    : !loggedUserCityId;
  const ifoodIntegrationMissingFields =
    Boolean(useIfoodIntegration) && !watch("ifoodMerchantId");
  const shouldWarnAnotaAiLink =
    Boolean(anotaAiEnabled) && !String(watch("anotaAiStoreId") || "").trim();
  const isSubmitDisabled =
    !name ||
    !phone ||
    !pix ||
    !profileImage ||
    phone.includes("_") ||
    citySelectionMissing ||
    ifoodIntegrationMissingFields;
  const isShopkeeperType =
    selectedType === "shopkeeper" || selectedType === "shopkeeperadmin";

  useEffect(() => {
    fetchLoggedUserCity();
    if (allowCitySelection) {
      fetchCities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowCitySelection]);

  useEffect(() => {
    if (user) {
      getUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (window.location.hash === "#anota-ai" && isShopkeeperType) {
      document
        .getElementById("anota-ai-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isShopkeeperType, userId]);

  return (
    <Container>
      <form onSubmit={handleSubmit(handleCreate)} action="">
        <FormContainer>
          <label htmlFor="name">Nome:</label>
          <BaseInput
            type="text"
            id="name"
            placeholder="Informe o nome."
            {...register("name")}
          />

          <label htmlFor="phone">Whatsapp:</label>
          <BaseInputMask
            type="text"
            mask="(99) 99999-9999"
            id="phone"
            placeholder="Informe o whatsapp."
            {...register("phone")}
          />

          <label htmlFor="user">User:</label>
          <BaseInput
            type="text"
            id="user"
            placeholder="Informe o usuário."
            {...register("user")}
          />

          {!user && (
            <>
              <label htmlFor="password">Senha:</label>
              <BaseInput
                type="password"
                id="password"
                placeholder="Informe a senha."
                {...register("password")}
              />
            </>
          )}

          <label htmlFor="pix">Pix:</label>
          <BaseInput
            type="text"
            id="pix"
            placeholder="Informe o pix."
            {...register("pix")}
          />

          <label htmlFor="profileImage">Link da imagem de perfil:</label>
          <BaseInput
            type="text"
            id="profileImage"
            placeholder="Informe o link da imagem."
            {...register("profileImage")}
          />

          <label htmlFor="location">Link do google maps:</label>
          <BaseInput
            type="text"
            id="location"
            placeholder="Informe o link da localização."
            {...register("location")}
          />

          {allowCitySelection && (
            <>
              <label htmlFor="cityId">Cidade:</label>
              <select
                id="cityId"
                value={selectedCityId}
                onChange={(event) => setSelectedCityId(event.target.value)}
                disabled={citiesLoading}
              >
                <option value="">Selecione a cidade</option>
                {cities.map((city) => (
                  <option key={city.id ?? city.name} value={city.id ?? ""}>
                    {city.state ? `${city.name} - ${city.state}` : city.name}
                  </option>
                ))}
              </select>
            </>
          )}

          <label htmlFor="userType">Tipo de usuário:</label>
          <select
            value={selectedType}
            onChange={(e) => {
              const nextType = e.target.value;
              setSelectedType(nextType);

              if (nextType !== "shopkeeper" && nextType !== "shopkeeperadmin") {
                setValue("useIfoodIntegration", false);
                setValue("ifoodMerchantId", "");
                resetAnotaAiFields();
              }
            }}
          >
            <option value="">Selecione uma opção:</option>
            <option value="shopkeeper">Lojista</option>
            <option value="shopkeeperadmin">Lojista Admin</option>
            <option value="motoboy">Motoboy</option>
            <option value="admin">Admin</option>
          </select>

          {isShopkeeperType && (
            <>
              <label htmlFor="useIfoodIntegration">
                <input
                  type="checkbox"
                  id="useIfoodIntegration"
                  checked={Boolean(useIfoodIntegration)}
                  onChange={(event) => {
                    const enabled = event.target.checked;
                    setValue("useIfoodIntegration", enabled);

                    if (!enabled) {
                      setValue("usesExternalIfoodPdv", false);
                      setValue("ifoodMerchantId", "");
                      setIfoodMerchants([]);
                    }
                  }}
                />{" "}
                Usar integração iFood para esta empresa
              </label>

              {useIfoodIntegration && (
                <>
                  <label htmlFor="usesExternalIfoodPdv">
                    <input
                      type="checkbox"
                      id="usesExternalIfoodPdv"
                      {...register("usesExternalIfoodPdv")}
                    />{" "}
                    Usa PDV externo integrado ao iFood?
                  </label>
                  <label htmlFor="ifoodMerchantId">
                    iFood Merchant ID (legado):
                  </label>
                  <BaseInput
                    type="text"
                    id="ifoodMerchantId"
                    placeholder="Compatibilidade com cadastro antigo."
                    {...register("ifoodMerchantId")}
                  />
                  <div>
                    <strong>Lojas iFood vinculadas</strong>
                    {ifoodMerchants.map((merchant, index) => (
                      <div
                        key={`${merchant.merchantId}-${index}`}
                        style={{
                          border: "1px solid #555",
                          padding: "0.75rem",
                          marginTop: "0.5rem",
                          borderRadius: 8,
                        }}
                      >
                        <label>Nome da loja:</label>
                        <BaseInput
                          type="text"
                          value={merchant.name || ""}
                          onChange={(event) =>
                            setIfoodMerchants((prev) =>
                              prev.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, name: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                        <label>Merchant ID:</label>
                        <BaseInput
                          type="text"
                          value={merchant.merchantId || ""}
                          onChange={(event) =>
                            setIfoodMerchants((prev) =>
                              prev.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, merchantId: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                        <label>Endereço de coleta (opcional):</label>
                        <BaseInput
                          type="text"
                          value={merchant.pickupAddress || ""}
                          onChange={(event) =>
                            setIfoodMerchants((prev) =>
                              prev.map((item, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...item,
                                      pickupAddress: event.target.value,
                                    }
                                  : item,
                              ),
                            )
                          }
                        />
                        <label>
                          <input
                            type="checkbox"
                            checked={merchant.enabled !== false}
                            onChange={(event) =>
                              setIfoodMerchants((prev) =>
                                prev.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, enabled: event.target.checked }
                                    : item,
                                ),
                              )
                            }
                          />{" "}
                          Ativa
                        </label>
                        <BaseButton
                          type="button"
                          onClick={() =>
                            setIfoodMerchants((prev) =>
                              prev.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            )
                          }
                        >
                          Remover loja
                        </BaseButton>
                      </div>
                    ))}
                    <BaseButton
                      type="button"
                      onClick={() => {
                        const updatedMerchants = [
                          ...ifoodMerchants,
                          {
                            merchantId: "",
                            name: "",
                            enabled: true,
                            pickupAddress: "",
                          },
                        ];
                        setIfoodMerchants(updatedMerchants);
                        setValue(
                          "ifoodMerchantId",
                          resolveLegacyMerchantId(
                            watch("ifoodMerchantId") || "",
                            updatedMerchants,
                          ),
                        );
                      }}
                    >
                      Adicionar loja iFood
                    </BaseButton>
                  </div>
                </>
              )}

              <IntegrationSection id="anota-ai-section">
                <h2>Integração Anota AI</h2>

                <label htmlFor="anotaAiEnabled">
                  <input
                    type="checkbox"
                    id="anotaAiEnabled"
                    checked={Boolean(anotaAiEnabled)}
                    onChange={(event) => {
                      const enabled = event.target.checked;
                      setValue("anotaAiEnabled", enabled);

                      if (!enabled) {
                        setValue("anotaAiStoreId", "");
                        setValue("anotaAiToken", "");
                      }

                      setValue("anotaAiIgnoreIfoodOrders", true);
                    }}
                  />{" "}
                  Ativar integração Anota AI para esta empresa
                </label>

                {userId ? (
                  <>
                    <InlineInfo>
                      <span>ID da empresa no Rappidex: {userId}</span>
                      <CopyButton type="button" onClick={handleCopyCompanyId}>
                        Copiar ID
                      </CopyButton>
                    </InlineInfo>
                    <HelpText>
                      Cole este ID no campo ID Externo do Restaurante no portal
                      da Anota AI.
                    </HelpText>
                  </>
                ) : (
                  <HelpText>
                    Salve a empresa primeiro para gerar o ID da empresa no
                    Rappidex. Depois cole esse ID no campo ID Externo do
                    Restaurante no portal da Anota AI.
                  </HelpText>
                )}

                <label htmlFor="anotaAiStoreId">
                  Root / ID interno da loja Anota AI
                </label>
                <BaseInput
                  type="text"
                  id="anotaAiStoreId"
                  placeholder="Root gerado pela Anota AI"
                  disabled={!anotaAiEnabled}
                  {...register("anotaAiStoreId")}
                />
                <HelpText>
                  Opcional. Cole aqui o Root gerado automaticamente no portal da
                  Anota AI caso o webhook envie o Root.
                </HelpText>
                {shouldWarnAnotaAiLink && (
                  <HelpText role="alert">
                    Recomendado preencher o Root ou garantir que o ID Externo do
                    Restaurante no portal da Anota AI seja o ID desta empresa no
                    Rappidex.
                  </HelpText>
                )}

                <label htmlFor="anotaAiToken">Token da Anota AI</label>
                <BaseInput
                  type="text"
                  id="anotaAiToken"
                  placeholder="Token da loja Anota AI"
                  disabled={!anotaAiEnabled}
                  {...register("anotaAiToken")}
                />
                <HelpText>
                  Cole aqui o token da loja gerado no portal da Anota AI, se a
                  loja usar token próprio.
                </HelpText>

                <label htmlFor="anotaAiIgnoreIfoodOrders">
                  <input
                    type="checkbox"
                    id="anotaAiIgnoreIfoodOrders"
                    disabled={!anotaAiEnabled}
                    {...register("anotaAiIgnoreIfoodOrders")}
                  />{" "}
                  Ignorar pedidos iFood vindos da Anota AI
                </label>

                <InlineInfo>
                  <span>Webhook Anota AI: {anotaAiWebhookUrl}</span>
                  <CopyButton
                    type="button"
                    onClick={() =>
                      navigator.clipboard.writeText(anotaAiWebhookUrl)
                    }
                  >
                    Copiar URL
                  </CopyButton>
                </InlineInfo>
                <HelpText>
                  Cadastre este caminho nos campos Pedidos Realizados, Pedidos
                  Atualizados e Pedidos Cancelados no portal da Anota AI, usando
                  método POST.
                </HelpText>

                <HelpText>
                  * Root é gerado pela Anota AI e identifica a loja dentro da
                  Anota AI.
                </HelpText>
                <HelpText>
                  * ID Externo do Restaurante deve ser o ID da empresa no
                  Rappidex.
                </HelpText>
                <HelpText>
                  * O webhook deve ser cadastrado no portal da Anota AI como
                  POST.
                </HelpText>
                <HelpText>
                  * A integração só cria pedido no Rappidex quando o pedido
                  estiver aceito/em produção, status 1.
                </HelpText>
              </IntegrationSection>
            </>
          )}

          {!user && (
            <ContainerButtons>
              <BaseButton disabled={isSubmitDisabled} type="submit">
                {loading ? (
                  <Loader size={20} biggestColor="gray" smallestColor="gray" />
                ) : (
                  "Criar novo usuário"
                )}
              </BaseButton>
            </ContainerButtons>
          )}
        </FormContainer>
      </form>
      {user && (
        <>
          {user && (
            <BaseButton disabled={isSubmitDisabled} onClick={handleSave}>
              {loading ? (
                <Loader size={20} biggestColor="gray" smallestColor="gray" />
              ) : (
                "Salvar"
              )}
            </BaseButton>
          )}

          <ResetPassButton onClick={handleReset}>
            {loadingResetPass ? (
              <Loader size={20} biggestColor="black" smallestColor="black" />
            ) : (
              "Resetar Senha"
            )}
          </ResetPassButton>

          <DeleteButton onClick={handleDelete}>
            {loadingDelete ? (
              <Loader size={20} biggestColor="gray" smallestColor="gray" />
            ) : (
              "Apagar usuário"
            )}
          </DeleteButton>
        </>
      )}
    </Container>
  );
}
