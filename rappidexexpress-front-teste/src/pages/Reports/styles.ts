import { Link } from 'react-router-dom'
import styled from 'styled-components'

export const Container = styled.main`
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: clamp(1rem, 3vw, 2rem) 1rem 2rem;
`

export const FiltersContainer = styled.div`
  width: min(100%, 64rem);
  padding: clamp(1rem, 3vw, 1.4rem);
  background: linear-gradient(145deg, ${(props) => props.theme['gray-700']}, ${(props) => props.theme['gray-800']});
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: ${(props) => props.theme['radius-xl']};
  box-shadow: ${(props) => props.theme['shadow-card']};
`

export const DataContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;

  input {
    min-height: 2.75rem;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: ${(props) => props.theme['radius-md']};
    background: ${(props) => props.theme['gray-800']};
    color: ${(props) => props.theme['gray-100']};
    padding: 0 0.75rem;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;

    input {
      width: 100%;
    }
  }
`

export const Filter = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
  align-items: center;

  select {
    min-height: 2.75rem;
    min-width: 12rem;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: ${(props) => props.theme['radius-md']};
    background-color: ${(props) => props.theme['gray-800']};
    color: ${(props) => props.theme['gray-100']};
    padding: 0 0.75rem;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;

    select {
      width: 100%;
    }
  }
`

export const SearchButton = styled.div`
  background: ${(props) => props.theme['green-500']};
  color: ${(props) => props.theme.white};
  min-height: 2.9rem;
  padding: 0.85rem 1rem;
  margin-top: 1rem;
  border-radius: ${(props) => props.theme['radius-md']};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  cursor: pointer;
  transition: filter 0.2s ease, transform 0.2s ease;

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }
`

export const ReportsContainer = styled.div`
  margin-top: 1rem;
  background: rgba(18, 18, 20, 0.36);
  padding: 0.75rem;
  border-radius: ${(props) => props.theme['radius-lg']};
  border: 1px solid rgba(255, 255, 255, 0.07);
`

export const Delivery = styled.div`
  background: ${(props) => props.theme['gray-700']};
  padding: 1rem;
  margin: 0.65rem 0;
  border-radius: ${(props) => props.theme['radius-lg']};
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: ${(props) => props.theme['shadow-soft']};
`

export const ContainerShopkeeper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;
`

export const ShopkeeperProfileImage = styled.img`
  height: 4.5rem;
  width: 4.5rem;
  border-radius: 100%;
  object-fit: cover;
`

export const ProfileImageContainer = styled.div`
  height: 4.5rem;
  width: 4.5rem;
  border-radius: 100%;
  border: 2px solid rgba(0, 179, 126, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
`

export const ShopkeeperInfo = styled.div`
  min-width: 0;

  p {
    overflow-wrap: anywhere;
  }
`

export const ContainerOrder = styled.div`
  margin: 0.85rem 0 0;
  padding: 0.85rem;
  border-radius: ${(props) => props.theme['radius-md']};
  background: rgba(255, 255, 255, 0.035);

  p {
    line-height: 1.45;
    overflow-wrap: anywhere;
  }
`

export const ContainerInfo = styled.div`
  margin: 0.85rem 0 0;
`

export const EditContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 0.85rem;
`

export const OnClickLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.45rem;
  padding: 0.65rem 0.9rem;
  border-radius: 999px;
  color: ${(props) => props.theme['gray-100']};
  background: ${(props) => props.theme['gray-600']};
  text-decoration: none;
  font-weight: 800;
  transition: filter 0.2s ease, transform 0.2s ease;

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }
`
