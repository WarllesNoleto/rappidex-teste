import { NavLink } from 'react-router-dom'
import styled from 'styled-components'

export const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 20;
  gap: 1rem;
  padding: 0.35rem 0 1rem;
  margin-bottom: 0.25rem;
  background: linear-gradient(180deg, color-mix(in srgb, var(--background-secondary) 98%, transparent), color-mix(in srgb, var(--background-secondary) 78%, transparent));
  backdrop-filter: blur(12px);
  border-bottom: 1px solid color-mix(in srgb, var(--border) 6%, transparent);

  @media (max-width: 768px) {
    padding: 0.35rem 0.15rem 0.85rem;
  }
`

export const DesktopMenu = styled.nav`
  display: flex;
  gap: 0.45rem;
  padding: 0.25rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--border) 4%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 6%, transparent);

  a {
    width: 3rem;
    height: 3rem;

    display: flex;
    justify-content: center;
    align-items: center;

    color: ${(props) => props.theme['gray-100']};

    border-radius: 999px;
    border: 1px solid transparent;
    text-decoration: none;
    transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;

    &:hover {
      background: color-mix(in srgb, var(--action-green) 10%, transparent);
      border-color: color-mix(in srgb, var(--action-green) 24%, transparent);
      color: ${(props) => props.theme['green-300']};
      transform: translateY(-1px);
    }

    &.active:not([data-ignore-active='true']) {
      background: ${(props) => props.theme['green-700']};
      border-color: ${(props) => props.theme['green-500']};
      color: ${(props) => props.theme.white};
      box-shadow: 0 0.65rem 1.2rem color-mix(in srgb, var(--action-green) 20%, transparent);
    }
  }

  @media (max-width: 767px) {
    display: none;
  }
`

export const MobileMenuButton = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border: 1px solid color-mix(in srgb, var(--border) 10%, transparent);
  border-radius: 0.875rem;
  background: ${(props) => props.theme['gray-800']};
  color: ${(props) => props.theme['gray-100']};
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;

  &:hover,
  &:active {
    background: ${(props) => props.theme['gray-700']};
    border-color: ${(props) => props.theme['green-500']};
  }

  &:active {
    transform: scale(0.98);
  }

  @media (max-width: 767px) {
    display: inline-flex;
  }
`

export const MobileMenuOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: flex;
  justify-content: flex-end;
  background: rgba(0, 0, 0, 0.58);
  backdrop-filter: blur(3px);
`

export const MobileMenuDrawer = styled.aside`
  position: relative;
  z-index: 9999;
  width: min(100vw, 20rem);
  height: 100vh;
  padding: 1.25rem;
  overflow-y: auto;
  background: linear-gradient(
    180deg,
    ${(props) => props.theme['gray-800']} 0%,
    ${(props) => props.theme['gray-900']} 100%
  );
  border-left: 1px solid color-mix(in srgb, var(--border) 10%, transparent);
  border-radius: 1.25rem 0 0 1.25rem;
  box-shadow: -1.25rem 0 2.5rem rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  animation: slideIn 0.2s ease;

  @media (max-width: 360px) {
    width: 100vw;
    border-radius: 0;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0.7;
    }

    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`

export const MobileMenuHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid color-mix(in srgb, var(--border) 10%, transparent);
  background: linear-gradient(
    180deg,
    ${(props) => props.theme['gray-800']} 0%,
    color-mix(in srgb, var(--background-secondary) 96%, transparent) 100%
  );

  strong {
    color: ${(props) => props.theme['gray-100']};
    font-size: 1.05rem;
    letter-spacing: 0.02em;
  }
`

export const MobileCloseButton = styled.button`
  position: relative;
  z-index: 10000;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border: 1px solid color-mix(in srgb, var(--border) 10%, transparent);
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--border) 4%, transparent);
  color: ${(props) => props.theme['gray-100']};
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover,
  &:active {
    background: color-mix(in srgb, var(--border) 8%, transparent);
    border-color: ${(props) => props.theme['green-500']};
  }
`

export const MobileMenuList = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  width: 100%;
`

export const MobileMenuLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-height: 3rem;
  padding: 0.75rem 0.85rem;
  border: 1px solid transparent;
  border-radius: 0.85rem;
  color: ${(props) => props.theme['gray-100']};
  text-decoration: none;
  font-weight: 700;
  line-height: 1.2;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;

  svg {
    flex: 0 0 auto;
    color: ${(props) => props.theme['green-500']};
  }

  span {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
  }

  &:hover {
    background: color-mix(in srgb, var(--border) 6%, transparent);
    border-color: color-mix(in srgb, var(--border) 10%, transparent);
  }

  &.active:not([data-ignore-active='true']) {
    background: color-mix(in srgb, var(--action-green) 22%, transparent);
    border-color: ${(props) => props.theme['green-500']};
    color: ${(props) => props.theme.white};
  }

  &:active {
    transform: translateY(1px);
  }
`

export const RappidexLogo = styled.img`
  height: 2.35rem;
  width: 2.35rem;
  border-radius: 100%;
  object-fit: cover;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--action-green) 16%, transparent);
`;
