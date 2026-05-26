import { useContext, useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import { DeliveryContext } from './context/DeliveryContext'
import api from './services/api'

import { Login } from './pages/Login'

import { DefaultLayout } from './layouts/DefaultLayout'
import { Dashboard } from './pages/Dashboard'
import { Reports } from './pages/Reports'
import { Profile } from './pages/Profile'
import { NewUser } from './pages/NewUser'
import { ChangePassword } from './pages/ChangePassword'
import { NewDelivery } from './pages/NewDelivery'
import { EditDelivery } from './pages/EditDelivery'
import { Config } from './pages/Config'
import { Users } from './pages/Users'
import { Cities } from './pages/Cities'
import { IfoodClients } from './pages/IfoodClients'
import { TermsOfUse } from './pages/TermsOfUse'
import { PrivacyPolicy } from './pages/PrivacyPolicy'

export function Router() {
  const { token, permission } = useContext(DeliveryContext)
  const [aiqfomeEnabled, setAiqfomeEnabled] = useState(false)

  useEffect(() => {
    if (!(permission === 'shopkeeper' || permission === 'shopkeeperadmin') || !token) return
    api.defaults.headers.Authorization = `Bearer ${token}`
    api.get('/user/myself')
      .then((res) => setAiqfomeEnabled(Boolean(res.data?.aiqfomeEnabled)))
      .catch(() => setAiqfomeEnabled(false))
  }, [permission, token])
  return (
    <Routes>
      <Route path="/termos-de-uso" element={<TermsOfUse />} />
      <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
      { 
      !token ? <Route path="/" element={<Login />} /> :
        <Route path="/" element={<DefaultLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/relatorios" element={<Reports />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/novo-usuario" element={<NewUser />} />
          <Route path="/novo-usuario/:user" element={<NewUser />} />
          <Route path="/alterar-senha" element={<ChangePassword />} />
          <Route path="/nova-entrega" element={<NewDelivery />} />
          <Route path="/editar-entrega" element={<EditDelivery />} />
          <Route path="/configuracao" element={<Config />} />
          <Route path="/usuarios" element={<Users />} />
          {(permission === 'admin' || permission === 'superadmin') && (
            <Route path="/clientes-ifood" element={<IfoodClients />} />
          )}
          {(permission === 'shopkeeper' || permission === 'shopkeeperadmin') && (
            <Route
              path="/clientes-ifood"
              element={aiqfomeEnabled ? <IfoodClients /> : <Navigate to="/" replace />}
            />
          )}
          {permission === 'superadmin' && (
            <Route path="/cidades" element={<Cities />} />
          )}
        </Route>
      }
    </Routes>
  )
  }
