import styled from "styled-components";
import InputMask from "react-input-mask";

export const Container = styled.main`
  flex: 1;
  width: 100%;
  /* min-width: 17rem; */
  display: grid;
  align-items: center;
  justify-content: center;

  margin-top: 2rem;

  background: ${(props) => props.theme["gray-600"]};

  form {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-top: 2rem;
    margin-bottom: 1rem;
  }
`;

export const FormContainer = styled.div`
  min-width: 15rem;
  display: flex;
  flex-direction: column;
  color: ${(props) => props.theme["gray-100"]};
  font-size: 1.125rem;
  font-weight: bold;

  gap: 1rem;

  label {
    font-size: 15px;
    text-align: start;
    color: ${(props) => props.theme["gray-500"]};
  }

  select {
    height: 2.5rem;
    background: ${(props) => props.theme["gray-600"]};
    color: ${(props) => props.theme["gray-100"]};
  }
`;

export const BaseInput = styled.input`
  background: transparent;
  height: 2.5rem;
  border: 0;
  border-bottom: 2px solid ${(props) => props.theme["gray-500"]};
  font-weight: bold;
  font-size: 1.125rem;
  color: ${(props) => props.theme["gray-100"]};

  &:focus {
    box-shadow: none;
    border-bottom: 2px solid ${(props) => props.theme["green-500"]};
  }

  &::placeholder {
    color: ${(props) => props.theme["gray-500"]};
  }
`;

export const BaseInputMask = styled(InputMask)`
  background: transparent;
  height: 2.5rem;
  border: 0;
  border-bottom: 2px solid ${(props) => props.theme["gray-500"]};
  font-weight: bold;
  font-size: 1.125rem;
  color: ${(props) => props.theme["gray-100"]};

  &:focus {
    box-shadow: none;
    border-bottom: 2px solid ${(props) => props.theme["green-500"]};
  }

  &::placeholder {
    color: ${(props) => props.theme["gray-500"]};
  }
`;

export const ContainerButtons = styled.div`
  /* width: 100%; */
`;

export const BaseButton = styled.button`
  width: 100%;
  border: 0;
  padding: 1rem;
  margin: 0rem 0rem 1rem 0rem;
  border-radius: 8px;

  display: flex;
  align-items: center;
  justify-content: center;

  gap: 0.5rem;
  font-weight: bold;
  cursor: pointer;

  background: ${(props) => props.theme["green-700"]};
  color: ${(props) => props.theme["gray-100"]};
`;

export const DeleteButton = styled(BaseButton)`
  background: ${(props) => props.theme["red-500"]};
`;

export const ResetPassButton = styled(BaseButton)`
  background: ${(props) => props.theme["yellow-500"]};
  color: ${(props) => props.theme["gray-900"]};
`;

export const IntegrationSection = styled.section`
  width: 100%;
  border: 1px solid ${(props) => props.theme["gray-500"]};
  border-radius: 8px;
  padding: 1rem;
  margin-top: 0.5rem;

  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  h2 {
    margin: 0;
    color: ${(props) => props.theme["gray-100"]};
    font-size: 1.25rem;
  }
`;

export const HelpText = styled.p`
  margin: -0.35rem 0 0;
  color: ${(props) => props.theme["gray-500"]};
  font-size: 0.875rem;
  font-weight: normal;
  line-height: 1.4;
`;

export const InlineInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  color: ${(props) => props.theme["gray-100"]};
  font-size: 0.95rem;
`;

export const CopyButton = styled.button`
  border: 0;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  background: ${(props) => props.theme["green-700"]};
  color: ${(props) => props.theme["gray-100"]};
`;
