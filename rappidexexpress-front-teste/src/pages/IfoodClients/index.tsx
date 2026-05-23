/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext, useEffect, useMemo, useState } from 'react';

import { DeliveryContext } from '../../context/DeliveryContext';
import api from '../../services/api';
import { Loader } from '../../components/Loader';
import { User } from '../../shared/interfaces';
import { formatIfoodHistoryDateTime, translateIfoodOperationType } from '../../shared/utils/ifoodHistory.ts';
import {
  Actions,
  CreditButton,
  CreditButtons,
  CreditInput,
  CreditLine,
  CreditSummary,
  Card,
  Checkbox,
  Container,
  Content,
  Input,
  LoadingContainer,
  MerchantIdLabel,
  SaveButton,
  ShopkeeperName,
  Subtitle,
  Title,
  HistoryButton,
  HistoryItem,
  HistoryList,
  SectionTitle,
  SectionDivider,
} from './styles.ts';

export function IfoodClients() {
  const { token } = useContext(DeliveryContext);
  api.defaults.headers.Authorization = `Bearer ${token}`;
  const [loading, setLoading] = useState(true);
  const [savingUser, setSavingUser] = useState('');
  const [shopkeepers, setShopkeepers] = useState<User[]>([]);
  const [creditAmountByUser, setCreditAmountByUser] = useState<Record<string, number>>({});
  const [historyByUser, setHistoryByUser] = useState<Record<string, any[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const ITEMS_PER_PAGE = 200;

  const filteredShopkeepers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return shopkeepers;
    return shopkeepers.filter((shopkeeper) => (shopkeeper.name || '').toLowerCase().includes(normalizedSearch));
  }, [shopkeepers, searchTerm]);

  function updateLocalUser(userId: string, changes: Partial<User>) {
    setShopkeepers((currentUsers) => currentUsers.map((shopkeeper) => (shopkeeper.id === userId ? { ...shopkeeper, ...changes } : shopkeeper)));
  }

  async function loadShopkeepers(targetPage = 1, shouldAppend = false) {
setLoading(true);
    try {
      const usersResponse = await api.get(`/user?type=shopkeeper&page=${targetPage}&itemsPerPage=${ITEMS_PER_PAGE}`);
      const users = Array.isArray(usersResponse.data?.data) ? usersResponse.data.data : [];
      setShopkeepers((currentUsers) => (shouldAppend ? [...currentUsers, ...users] : users));
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Erro ao buscar lojistas.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(shopkeeper: User) {
    if (savingUser) return;
    const merchantId = (shopkeeper.ifoodMerchantId || '').trim();
    if (shopkeeper.useIfoodIntegration && !merchantId) {
      alert('Informe o Merchant ID para ativar a integração iFood.');
      return;
    }
    setSavingUser(shopkeeper.user);
    try {
      await api.put(`/user/${shopkeeper.id}`, { useIfoodIntegration: Boolean(shopkeeper.useIfoodIntegration), ifoodMerchantId: merchantId });
      alert('Configuração iFood salva com sucesso.');
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Erro ao salvar configuração iFood.');
    } finally {
      setSavingUser('');
    }
  }

  async function handleSaveAiqfome(shopkeeper: User) {
    if (savingUser) return;
    setSavingUser(shopkeeper.user);
    try {
      await api.put(`/user/${shopkeeper.id}/aiqfome-config`, {
        aiqfomeEnabled: Boolean(shopkeeper.aiqfomeEnabled),
        aiqfomeStoreId: (shopkeeper.aiqfomeStoreId || '').trim(),
        aiqfomeAccessToken: shopkeeper.aiqfomeAccessToken || '',
        aiqfomeRefreshToken: shopkeeper.aiqfomeRefreshToken || '',
        aiqfomeTokenExpiresAt: shopkeeper.aiqfomeTokenExpiresAt || undefined,
        aiqfomeWebhookSecret: (shopkeeper.aiqfomeWebhookSecret || '').trim(),
      });
      alert('Configuração aiqfome salva com sucesso.');
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Erro ao salvar configuração aiqfome.');
    } finally {
      setSavingUser('');
    }
  }

  function updateCreditAmount(userId: string, value: string) { const parsedValue = Number(value); setCreditAmountByUser((c) => ({ ...c, [userId]: Number.isNaN(parsedValue) ? 0 : parsedValue })); }
  async function handleCreditAdjustment(shopkeeper: User, action: 'add' | 'remove') { /* unchanged behavior */
    if (savingUser) return; const amount = Number(creditAmountByUser[shopkeeper.id] || 0); if (!amount || amount < 1) return alert('Informe uma quantidade válida de créditos.');
    setSavingUser(shopkeeper.user); try { const response = await api.post(`/ifood/credits/company/${shopkeeper.id}/${action}`, { amount }); updateLocalUser(shopkeeper.id, { ifoodOrdersReleased: response.data?.ifoodOrdersReleased ?? shopkeeper.ifoodOrdersReleased, ifoodOrdersUsed: response.data?.ifoodOrdersUsed ?? shopkeeper.ifoodOrdersUsed, ifoodOrdersAvailable: response.data?.ifoodOrdersAvailable ?? shopkeeper.ifoodOrdersAvailable, }); alert(`Créditos ${action === 'add' ? 'adicionados' : 'removidos'} com sucesso.`); } catch (error: any) { alert(error?.response?.data?.message || 'Erro ao ajustar créditos.'); } finally { setSavingUser(''); }
  }
  async function handleLoadHistory(shopkeeper: User) { try { const response = await api.get(`/ifood/credits/company/${shopkeeper.id}/history`); setHistoryByUser((c) => ({ ...c, [shopkeeper.id]: Array.isArray(response.data?.history) ? response.data.history : [] })); } catch (error: any) { alert(error?.response?.data?.message || 'Erro ao carregar histórico.'); } }

  useEffect(() => { loadShopkeepers(); }, []);

  return <Container><Content><Title>Empresas Cadastradas</Title><Subtitle>Vincule cada lojista ao Merchant ID do iFood para permitir a importação dos pedidos corretamente.</Subtitle>
    <Input onChange={(e) => setSearchTerm(e.target.value)} placeholder="Pesquisar empresa por nome" value={searchTerm} />
    {loading ? <LoadingContainer><Loader size={40} biggestColor="green" smallestColor="gray" /></LoadingContainer> : filteredShopkeepers.map((shopkeeper) => <Card key={shopkeeper.id}><ShopkeeperName>{shopkeeper.name}</ShopkeeperName><Actions>
      <SectionTitle>Integração iFood</SectionTitle>
      <Checkbox><input checked={Boolean(shopkeeper.useIfoodIntegration)} onChange={(event) => updateLocalUser(shopkeeper.id, { useIfoodIntegration: event.target.checked, ifoodMerchantId: event.target.checked ? shopkeeper.ifoodMerchantId : '' })} type="checkbox"/> Usar integração iFood</Checkbox>
      <div><MerchantIdLabel>Merchant ID</MerchantIdLabel><Input disabled={!shopkeeper.useIfoodIntegration} onChange={(e)=>updateLocalUser(shopkeeper.id,{ifoodMerchantId:e.target.value})} value={shopkeeper.ifoodMerchantId||''}/></div>
      <CreditSummary><CreditLine>Liberados: {shopkeeper.ifoodOrdersReleased || 0}</CreditLine><CreditLine>Utilizados: {shopkeeper.ifoodOrdersUsed || 0}</CreditLine><CreditLine>Disponíveis: {shopkeeper.ifoodOrdersAvailable || 0}</CreditLine></CreditSummary>
      <CreditButtons><CreditInput min={1} onChange={(e)=>updateCreditAmount(shopkeeper.id,e.target.value)} type="number" value={creditAmountByUser[shopkeeper.id]||''}/><CreditButton type="button" onClick={()=>handleCreditAdjustment(shopkeeper,'add')}>+ Créditos</CreditButton><CreditButton type="button" onClick={()=>handleCreditAdjustment(shopkeeper,'remove')}>- Créditos</CreditButton><HistoryButton type="button" onClick={()=>handleLoadHistory(shopkeeper)}>Ver histórico</HistoryButton></CreditButtons>
      {historyByUser[shopkeeper.id]?.length ? <HistoryList>{historyByUser[shopkeeper.id].map((entry)=> <HistoryItem key={entry.id}>{formatIfoodHistoryDateTime(entry.createdAt)} - {translateIfoodOperationType(entry.operationType)} ({entry.amount})</HistoryItem>)}</HistoryList> : null}
      <SaveButton type="button" onClick={()=>handleSave(shopkeeper)}>Salvar</SaveButton>
      <SectionDivider />
      <SectionTitle>Integração aiqfome</SectionTitle>
      <Checkbox><input type="checkbox" checked={Boolean(shopkeeper.aiqfomeEnabled)} onChange={(e)=>updateLocalUser(shopkeeper.id,{aiqfomeEnabled:e.target.checked})}/> Usar integração aiqfome</Checkbox>
      <div><MerchantIdLabel>Store ID aiqfome</MerchantIdLabel><Input onChange={(e)=>updateLocalUser(shopkeeper.id,{aiqfomeStoreId:e.target.value})} value={shopkeeper.aiqfomeStoreId||''}/></div>
      <div><MerchantIdLabel>Access Token aiqfome</MerchantIdLabel><Input onChange={(e)=>updateLocalUser(shopkeeper.id,{aiqfomeAccessToken:e.target.value})} value={shopkeeper.aiqfomeAccessToken||''}/></div>
      <div><MerchantIdLabel>Refresh Token aiqfome</MerchantIdLabel><Input onChange={(e)=>updateLocalUser(shopkeeper.id,{aiqfomeRefreshToken:e.target.value})} value={shopkeeper.aiqfomeRefreshToken||''}/></div>
      <div><MerchantIdLabel>Token expira em</MerchantIdLabel><Input type="datetime-local" onChange={(e)=>updateLocalUser(shopkeeper.id,{aiqfomeTokenExpiresAt:e.target.value})} value={shopkeeper.aiqfomeTokenExpiresAt ? String(shopkeeper.aiqfomeTokenExpiresAt).slice(0,16) : ''}/></div>
      <div><MerchantIdLabel>Webhook Secret aiqfome</MerchantIdLabel><Input onChange={(e)=>updateLocalUser(shopkeeper.id,{aiqfomeWebhookSecret:e.target.value})} value={shopkeeper.aiqfomeWebhookSecret||''}/></div>
      <SaveButton type="button" onClick={()=>handleSaveAiqfome(shopkeeper)}>Salvar configuração aiqfome</SaveButton>
    </Actions></Card>)}</Content></Container>;
}
