import styled from 'styled-components'

export const Container = styled.main`
  flex: 1;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;

  form {
    width: min(100%, 25rem);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: clamp(1.25rem, 4vw, 2rem);
    border-radius: ${(props) => props.theme['radius-xl']};
    background: linear-gradient(145deg, color-mix(in srgb, var(--card) 96%, transparent), color-mix(in srgb, var(--background-primary) 96%, transparent));
    border: 1px solid color-mix(in srgb, var(--border) 8%, transparent);
    box-shadow: ${(props) => props.theme['shadow-card']};
  }
`

export const BaseButton = styled.button`
  width: 100%;
  min-height: 2.9rem;
  border: 0;
  padding: 0.85rem 1rem;
  margin-top: 1rem;
  border-radius: ${(props) => props.theme['radius-md']};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 800;
  color: ${(props) => props.theme.white};
  background: ${(props) => props.theme['green-500']};
  cursor: pointer;
  transition: filter 0.2s ease, transform 0.2s ease, opacity 0.2s ease;

  &:not(:disabled):hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
  }
`

export const FormContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  color: ${(props) => props.theme['gray-100']};
  gap: 0.85rem;
`

export const BaseInput = styled.input`
  width: 100%;
  min-height: 2.85rem;
  border: 1px solid color-mix(in srgb, var(--border) 12%, transparent);
  border-radius: ${(props) => props.theme['radius-md']};
  background: color-mix(in srgb, var(--background-primary) 82%, transparent);
  padding: 0 0.9rem;
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

export const Logo = styled.img`
  height: 7rem;
  width: 7rem;
  border-radius: 100%;
  margin-bottom: 1.5rem;
  object-fit: cover;
  box-shadow: 0 0 0 0.5rem color-mix(in srgb, var(--action-green) 8%, transparent);
`
