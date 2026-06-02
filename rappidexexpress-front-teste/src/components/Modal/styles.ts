import { styled } from 'styled-components'

export const BaseInput = styled.input`
  width: 100%;
  min-height: 2.85rem;
  border: 1px solid color-mix(in srgb, var(--border) 12%, transparent);
  border-radius: ${(props) => props.theme['radius-md']};
  background: color-mix(in srgb, var(--background-primary) 82%, transparent);
  padding: 0 0.9rem;
  margin: 0.75rem 0 1rem;
  font-weight: 700;
  color: ${(props) => props.theme['gray-100']};
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    border-color: ${(props) => props.theme['green-500']};
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--action-green) 16%, transparent);
  }

  &::placeholder {
    color: ${(props) => props.theme['gray-400']};
  }
`

export const ContainerButtons = styled.div`
  width: 100%;
`

export const BaseButton = styled.button`
  width: 100%;
  min-height: 2.9rem;
  border: 0;
  padding: 0.85rem 1rem;
  border-radius: ${(props) => props.theme['radius-md']};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 800;
  cursor: pointer;
  background: ${(props) => props.theme['green-500']};
  color: ${(props) => props.theme.white};
  transition: filter 0.2s ease, transform 0.2s ease, opacity 0.2s ease;

  &:not(:disabled):hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }
`
