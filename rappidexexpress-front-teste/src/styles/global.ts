import { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`

  :root {
    --brand-yellow: ${(props) => props.theme['brand-yellow']};
    --brand-orange: ${(props) => props.theme['brand-orange']};
    --brand-red: ${(props) => props.theme['brand-red']};
    --background-primary: ${(props) => props.theme['background-primary']};
    --background-secondary: ${(props) => props.theme['background-secondary']};
    --card: ${(props) => props.theme.card};
    --card-light: ${(props) => props.theme['card-light']};
    --border: ${(props) => props.theme.border};
    --action-green: ${(props) => props.theme['action-green']};
    --action-green-hover: ${(props) => props.theme['action-green-hover']};
    --action-green-dark: ${(props) => props.theme['action-green-dark']};
    --danger-red: ${(props) => props.theme['danger-red']};
    --danger-red-hover: ${(props) => props.theme['danger-red-hover']};
    --warning-yellow: ${(props) => props.theme['warning-yellow']};
    --info-blue: ${(props) => props.theme['info-blue']};
    --text-primary: ${(props) => props.theme['text-primary']};
    --text-secondary: ${(props) => props.theme['text-secondary']};
    --text-soft: ${(props) => props.theme['text-soft']};
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    min-width: 0;
    background: ${(props) => props.theme['gray-950']};
  }

  body {
    min-width: 0;
    min-height: 100vh;
    overflow-x: hidden;
    background:
      radial-gradient(circle at top left, color-mix(in srgb, var(--action-green) 12%, transparent), transparent 28rem),
      linear-gradient(180deg, ${(props) => props.theme['gray-900']} 0%, ${(props) => props.theme['gray-950']} 100%);
    color: ${(props) => props.theme['gray-300']};
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  body, input, textarea, button, select {
    font-family: 'Roboto', sans-serif;
    font-weight: 400;
    font-size: 1rem;
  }

  button, select, input, textarea {
    max-width: 100%;
  }

  button {
    cursor: pointer;
  }

  button:disabled {
    cursor: not-allowed;
  }

  a {
    color: inherit;
  }

  img, svg {
    max-width: 100%;
  }

  input, textarea, select {
    color-scheme: dark;
  }

  select {
    appearance: none;
    background-image:
      linear-gradient(45deg, transparent 50%, ${(props) => props.theme['gray-300']} 50%),
      linear-gradient(135deg, ${(props) => props.theme['gray-300']} 50%, transparent 50%);
    background-position:
      calc(100% - 1.05rem) 50%,
      calc(100% - 0.75rem) 50%;
    background-size: 0.35rem 0.35rem, 0.35rem 0.35rem;
    background-repeat: no-repeat;
    padding-right: 2.25rem !important;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  :focus-visible {
    outline: 0;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--action-green) 22%, transparent);
  }

  ::selection {
    background: color-mix(in srgb, var(--action-green) 32%, transparent);
    color: ${(props) => props.theme.white};
  }

  ::-webkit-scrollbar {
    width: 0.65rem;
    height: 0.65rem;
  }

  ::-webkit-scrollbar-track {
    background: ${(props) => props.theme['gray-900']};
  }

  ::-webkit-scrollbar-thumb {
    background: ${(props) => props.theme['gray-600']};
    border-radius: 999px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${(props) => props.theme['gray-500']};
  }
`
