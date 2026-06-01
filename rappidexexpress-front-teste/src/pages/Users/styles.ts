import styled from "styled-components";

export const Container = styled.main`
  flex: 1;
  width: 100%;
  display: grid;
  align-items: center;
  justify-content: center;
  margin-top: 2rem;
`;

export const Content = styled.div``;

export const HeaderFilter = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
`;

interface FilterProps {
  isSelected: boolean;
}
export const Filter = styled.div<FilterProps>`
  width: 100%;
  border: solid;
  border-color: ${(props) => props.theme["gray-500"]};
  padding: 1rem;
  margin: 0rem 0rem 1rem 0rem;
  border-radius: 8px;

  display: flex;
  align-items: center;
  justify-content: center;

  gap: 0.5rem;
  font-weight: bold;
  cursor: pointer;

  background-color: ${(props) => props.isSelected && props.theme["gray-500"]};
  color: ${(props) => props.isSelected && props.theme["gray-900"]};
`;

export const ContainerLoading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const UsersContainer = styled.div``;

export const UserContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  margin: 0rem 0rem 1rem 0rem;

  cursor: pointer;
  background-color: ${(props) => props.theme["gray-600"]};
`;

export const ContainerProfileImage = styled.div`
  height: 7rem;
  width: 7rem;

  border-radius: 100%;
  border: solid;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const ProfileImage = styled.img`
  height: 7rem;
  width: 7rem;
  border-radius: 100%;
`;

export const Username = styled.p`
  font-weight: bold;
`;

export const LoadMoreButton = styled.button`
  width: 100%;
  border: 0;
  padding: 1rem;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  color: ${(props) => props.theme["gray-100"]};
  background-color: ${(props) => props.theme["green-700"]};

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

export const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const IntegrationStatus = styled.span`
  color: ${(props) => props.theme["gray-100"]};
  font-size: 0.875rem;
  font-weight: bold;
`;

export const ConfigureButton = styled.button`
  border: 0;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  color: ${(props) => props.theme["gray-100"]};
  background-color: ${(props) => props.theme["green-700"]};
`;

export const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.65);
`;

export const ModalCard = styled.div`
  width: min(100%, 34rem);
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.5rem;
  border-radius: 8px;
  color: ${(props) => props.theme["gray-100"]};
  background-color: ${(props) => props.theme["gray-700"]};

  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  h2 {
    margin: 0;
  }
`;

export const ModalCheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: bold;
`;

export const ModalField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;

  label,
  span {
    font-weight: bold;
  }
`;

export const ModalInput = styled.input`
  width: 100%;
  border: solid;
  border-color: ${(props) => props.theme["gray-500"]};
  padding: 1rem;
  border-radius: 8px;
  color: ${(props) => props.theme["gray-900"]};
  background-color: ${(props) => props.theme["gray-100"]};
`;

export const WebhookUrlBox = styled.div`
  padding: 0.75rem;
  border-radius: 8px;
  overflow-wrap: anywhere;
  color: ${(props) => props.theme["gray-900"]};
  background-color: ${(props) => props.theme["gray-100"]};
`;

export const ModalActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.75rem;
`;

interface ModalButtonProps {
  variant?: "primary" | "secondary";
}

export const ModalButton = styled.button<ModalButtonProps>`
  border: 0;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  color: ${(props) => props.theme["gray-100"]};
  background-color: ${(props) =>
    props.variant === "secondary"
      ? props.theme["gray-500"]
      : props.theme["green-700"]};

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;
