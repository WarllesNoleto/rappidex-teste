import { MapPin, WhatsappLogo } from "phosphor-react";
import { memo } from "react";

import { Motoboy, Report } from "../../../shared/interfaces";
import { StatusDelivery } from "../../../shared/constants/enums.constants";
import {
  messageTypes,
  getLinkToWhatsapp,
} from "../../../shared/constants/whatsapp.constants";
import {
  ContainerImagem,
  ContainerInfo,
  ContainerOrder,
  ContainerShopkeeper,
  ContainerStatus,
  Delivery,
  Link,
  OrderActions,
  OrderButton,
  SelectContainer,
  ShopkeeperInfo,
  ShopkeeperProfileImage,
  Status,
} from "../styles";

type DeliveryCardProps = {
  report: Report;
  statusFilter: string;
  permission: string | null;
  selectedMotoboy: string;
  motoboys: Motoboy[];
  isUpdating: boolean;
  onSelectMotoboy: (motoboyId: string) => void;
  onSave: (report: Report) => void;
  onCancel: (report: Report) => void;
  onNextStep: (report: Report) => void;
  onDelete: (report: Report) => void;
  getButtonText: (currentStatus: string, id: string) => string;
  getHours: (date: string) => string;
  formatPhoneNumber: (phone: string) => string;
  getIfoodOrderNumber: (observation?: string) => string | null;
  getClientWhatsappMessage: (report: Report) => string | undefined;
};

export const DeliveryCard = memo(function DeliveryCard({
  report,
  statusFilter,
  permission,
  selectedMotoboy,
  motoboys,
  isUpdating,
  onSelectMotoboy,
  onSave,
  onCancel,
  onNextStep,
  onDelete,
  getButtonText,
  getHours,
  formatPhoneNumber,
  getIfoodOrderNumber,
  getClientWhatsappMessage,
}: DeliveryCardProps) {
  const isIfoodOrder = report.observation?.includes("Pedido iFood #") ?? false;
  const ifoodOrderNumber = getIfoodOrderNumber(report.observation);

  return (
    <Delivery
      isfree={report.status === StatusDelivery.PENDING}
      isIfood={isIfoodOrder}
    >
      <ContainerShopkeeper>
        <ContainerImagem>
          <ShopkeeperProfileImage src={report.establishmentImage} />
        </ContainerImagem>

        <ShopkeeperInfo>
          <p>{report.establishmentName}</p>

          <Link
            href={getLinkToWhatsapp(
              report.establishmentPhone,
              messageTypes.motoboy,
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            {formatPhoneNumber(report.establishmentPhone)} <WhatsappLogo size={18} />
          </Link>

          <Link
            href={report.establishmentLocation}
            target="_blank"
            rel="noopener noreferrer"
          >
            <p>Localização</p> <MapPin size={18} />
          </Link>
        </ShopkeeperInfo>
      </ContainerShopkeeper>

      {statusFilter !== StatusDelivery.PENDING && (
        <ContainerOrder>
          <ContainerStatus>
            <p>Status:</p>
            <Status type={report.status}>{report.status}</Status>
          </ContainerStatus>
          <p>Forma de pagamento: {report.payment}</p>
          <p>Valor: R$ {report.value}</p>
          <p>Pix: {report.establishmentPix}</p>
          <p>Refrigerante: {report.soda}</p>
        </ContainerOrder>
      )}

      <ContainerInfo>
        <div>
          {isIfoodOrder && ifoodOrderNumber && <p>Pedido iFood: {ifoodOrderNumber}</p>}

          <p>Cliente: {report.clientName}</p>
        </div>

        {statusFilter !== StatusDelivery.PENDING && (
          <Link
            href={getLinkToWhatsapp(
              report.clientPhone,
              messageTypes.client,
              getClientWhatsappMessage(report),
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            {formatPhoneNumber(report.clientPhone)} <WhatsappLogo size={18} />
          </Link>
        )}
      </ContainerInfo>

      {statusFilter !== StatusDelivery.PENDING && (
        <ContainerInfo>
          <p>Motoboy: {report.motoboyName}</p>
          <Link
            href={getLinkToWhatsapp(report.motoboyPhone, messageTypes.establishment)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {formatPhoneNumber(report.motoboyPhone)} <WhatsappLogo size={18} />
          </Link>
        </ContainerInfo>
      )}

      <ContainerInfo>
        {report.createdAt && <p>Criado: {getHours(report.createdAt)}</p>}
        {report.onCoursedAt && <p>Atribuído: {getHours(report.onCoursedAt)}</p>}
        {report.collectedAt && <p>Coletado: {getHours(report.collectedAt)}</p>}
        {report.finishedAt && <p>Finalizado: {getHours(report.finishedAt)}</p>}
      </ContainerInfo>

      {permission !== "shopkeeper" && (
        <SelectContainer>
          <label htmlFor="motoboy">Motoboy:</label>
          <select
            disabled={isUpdating}
            value={selectedMotoboy}
            onChange={(e) => onSelectMotoboy(e.target.value)}
          >
            <option value="">Selecione o motoboy:</option>
            {motoboys.map((motoboy: Motoboy) => (
              <option key={motoboy.id} value={motoboy.id}>
                {motoboy.name}
              </option>
            ))}
          </select>
        </SelectContainer>
      )}

      <OrderActions>
        {(permission === "admin" || permission === "superadmin") &&
          report.status !== StatusDelivery.PENDING && (
            <>
              <OrderButton
                typebutton={true}
                onClick={() => onSave(report)}
              >
                Salvar
              </OrderButton>
              <OrderButton
                typebutton={false}
                onClick={() => onCancel(report)}
              >
                Cancelar
              </OrderButton>
            </>
          )}

        {permission !== "shopkeeper" && (
          <OrderButton
            typebutton={true}
            onClick={() => onNextStep(report)}
          >
            {getButtonText(report.status, report.id)}
          </OrderButton>
        )}

        {permission !== "motoboy" && report.status === StatusDelivery.PENDING && (
          <OrderButton
            typebutton={false}
            onClick={() => onDelete(report)}
          >
            Apagar
          </OrderButton>
        )}
      </OrderActions>
    </Delivery>
  );
}, areDeliveryCardPropsEqual);

function areDeliveryCardPropsEqual(
  prev: DeliveryCardProps,
  next: DeliveryCardProps,
) {
  return (
    prev.report === next.report &&
    prev.statusFilter === next.statusFilter &&
    prev.permission === next.permission &&
    prev.selectedMotoboy === next.selectedMotoboy &&
    prev.motoboys === next.motoboys &&
    prev.isUpdating === next.isUpdating
  );
}