import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import transparentLogo from '../assets/dark_new_logo.jpeg';
import { searchSite } from '../siteSearchIndex';

const HeaderContainer = styled.header`
  background: #000000;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  transform: translateY(${props => props.isVisible ? '0' : '-100%'});
  transition: transform 0.3s ease-in-out;
`;

const NavContainer = styled.div`
  margin: 0 auto;
  padding: 0 clamp(12px, 3vw, 20px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  min-height: 64px;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 3rem;
  min-width: 0;

  @media (max-width: 1024px) {
    gap: 0.75rem;
  }
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
`;

const LogoImage = styled.img`
  height: 72px;
  width: auto;
  margin-right: 0.5rem;
  background: transparent;
  
  @media (max-width: 768px) {
    height: 56px;
  }
`;

const MainNav = styled.nav`
  display: flex;
  align-items: center;
  gap: 1rem;
  @media (max-width: 1024px) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  font-weight: 400;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 1.375rem;
  white-space: nowrap;
  opacity: 0.9;
  &:hover {
    color: ${props => props.theme?.colors?.primary || '#00C896'};
    background-color: rgba(255, 255, 255, 0.1);
    opacity: 1;
  }
  &.active {
    color: ${props => props.theme?.colors?.primary || '#00C896'};
    font-weight: 500;
    opacity: 1;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;

  @media (max-width: 480px) {
    gap: 0.25rem;
  }
`;

const MenuToggle = styled.button`
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
  border-radius: 6px;
  color: white;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 1024px) {
    display: flex;
  }
`;

const BtnLabel = styled.span`
  @media (max-width: 640px) {
    display: none;
  }
`;

const MobileNavBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  z-index: 1100;
  display: ${({ $open }) => ($open ? 'block' : 'none')};
`;

const MobileNavDrawer = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: min(300px, 86vw);
  background: #0a0a0a;
  border-right: 1px solid rgba(255, 255, 255, 0.12);
  z-index: 1101;
  transform: translateX(${({ $open }) => ($open ? '0' : '-100%')});
  transition: transform 0.25s ease;
  display: flex;
  flex-direction: column;
  padding: 1rem 0 1.5rem;
  overflow-y: auto;
`;

const MobileNavHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 0.5rem;
`;

const MobileNavTitle = styled.span`
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
`;

const MobileCloseBtn = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const MobileNavLink = styled(Link)`
  color: white;
  text-decoration: none;
  font-size: 1.125rem;
  padding: 14px 1.25rem;
  display: block;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  &.active {
    color: ${props => props.theme?.colors?.primary || '#00C896'};
    background: rgba(0, 200, 150, 0.08);
  }
  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
`;

const MobileNavActions = styled.div`
  margin-top: auto;
  padding: 1rem 1.25rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const MobileActionBtn = styled(Link)`
  display: block;
  text-align: center;
  text-decoration: none;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  background: ${({ $primary, theme }) =>
    $primary ? theme?.colors?.primary || '#00C896' : 'transparent'};
  color: ${({ $primary }) => ($primary ? '#fff' : 'white')};
  border: 1px solid
    ${({ $primary, theme }) =>
      $primary ? 'transparent' : 'rgba(255, 255, 255, 0.25)'};
`;

const MobileActionButton = styled.button`
  display: block;
  width: 100%;
  text-align: center;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  background: transparent;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.25);
  cursor: pointer;
`;

const StyledSearchIcon = styled.div`
  width: 22px;
  height: 22px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'/%3E%3C/svg%3E") no-repeat center;
  background-size: contain;
  margin-right: 0.5rem;
`;

const StyledUserIcon = styled.div`
  width: 22px;
  height: 22px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'/%3E%3C/svg%3E") no-repeat center;
  background-size: contain;
  margin-right: 0.5rem;
`;

const SearchButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px 14px;
  border-radius: 4px;
  transition: all 0.2s ease;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.375rem;
  font-weight: 400;
  opacity: 0.9;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    opacity: 1;
  }
`;

const SignInButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px 14px;
  border-radius: 4px;
  transition: all 0.2s ease;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.375rem;
  font-weight: 400;
  opacity: 0.9;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    opacity: 1;
  }
`;

const StartTrialButton = styled(Link)`
  background-color: ${props => props.theme?.colors?.primary || '#00C896'};
  color: white;
  text-decoration: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 1.25rem;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
  &:hover {
    background-color: #00B085;
  }

  @media (max-width: 640px) {
    padding: 10px 12px;
    font-size: 0.95rem;
  }

  @media (max-width: 1024px) {
    display: none;
  }
`;

const ImpersonationBar = styled.div`
  background: rgba(218, 165, 32, 0.2);
  border-bottom: 1px solid rgba(218, 165, 32, 0.45);
  color: #f5e6c8;
  padding: 0.5rem 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 1.05rem;
`;

const ImpersonationBtn = styled.button`
  background: #daa520;
  color: #111;
  border: none;
  padding: 0.4rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.95rem;
  &:hover {
    filter: brightness(1.08);
  }
`;

const SearchBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  z-index: 5000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 96px 16px 24px;
  @media (max-width: 1024px) {
    padding: 72px 12px 16px;
  }
`;

const SearchPanel = styled.div`
  width: 100%;
  max-width: 520px;
  background: #111111;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);
  overflow: hidden;
`;

const SearchInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 16px 18px;
  font-size: 1.125rem;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: #0a0a0a;
  color: #ffffff;
  outline: none;
  &::placeholder {
    color: rgba(255, 255, 255, 0.35);
  }
`;

const SearchResults = styled.ul`
  list-style: none;
  margin: 0;
  padding: 8px;
  max-height: min(52vh, 400px);
  overflow-y: auto;
`;

const SearchResultBtn = styled.button`
  width: 100%;
  text-align: left;
  padding: 12px 14px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  &:hover {
    background: rgba(0, 200, 150, 0.12);
  }
`;

const ResultPath = styled.span`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.45);
  font-family: ui-monospace, Menlo, monospace;
`;

const SearchFooter = styled.p`
  margin: 0;
  padding: 10px 18px 14px;
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.42);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
`;

const Header = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout, stopImpersonating } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  const searchResults = useMemo(() => searchSite(searchQuery, { limit: 20 }), [searchQuery]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!searchOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onEsc = (e) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onEsc);
    const t = window.setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 10);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onEsc);
      window.clearTimeout(t);
    };
  }, [searchOpen]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show header at top of page
      if (currentScrollY < 10) {
        setIsVisible(true);
      } 
      // Hide header when scrolling down, show when scrolling up
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const isAdminUser = !!(user?.isAdmin ?? user?.is_admin);
  const canReturnToAdmin =
    user &&
    !isAdminUser &&
    typeof sessionStorage !== 'undefined' &&
    !!sessionStorage.getItem('kimuntu_admin_restore');

  const mainNavItems = [
    { path: '/about', label: 'About' },
    { path: '/pricing', label: 'Pricing' },
    { path: '/solutions', label: 'Solutions' },
    { path: '/benefits', label: 'Benefits' },
    { path: '/crm', label: 'CRM' },
    { path: '/products', label: 'Products' },
    { path: '/faq', label: 'FAQ' },
    { path: '/blog', label: 'Blog' },
  ];

  const handleLogout = () => {
    logout();
  };

  const handleReturnToAdmin = () => {
    if (stopImpersonating()) {
      navigate('/admin');
    }
  };

  const openSiteSearch = () => {
    setSearchQuery('');
    setSearchOpen(true);
  };

  const closeSiteSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
  };

  const goToSearchResult = (path) => {
    navigate(path);
    closeSiteSearch();
  };

  const searchModal =
    searchOpen &&
    typeof document !== 'undefined' &&
    createPortal(
      <SearchBackdrop
        role="presentation"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) closeSiteSearch();
        }}
      >
        <SearchPanel
          id="site-search-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Search KimuX"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <SearchInput
            ref={searchInputRef}
            type="search"
            placeholder="Search pages (e.g. pricing, CRM, FAQ)…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchResults[0]) {
                e.preventDefault();
                goToSearchResult(searchResults[0].path);
              }
            }}
            autoComplete="off"
            spellCheck={false}
          />
          <SearchResults>
            {searchResults.length === 0 ? (
              <li style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem' }}>
                No pages match that search. Try a shorter word or browse the menu.
              </li>
            ) : (
              searchResults.map((item) => (
                <li key={item.path}>
                  <SearchResultBtn type="button" onClick={() => goToSearchResult(item.path)}>
                    <span>{item.title}</span>
                    <ResultPath>{item.path}</ResultPath>
                  </SearchResultBtn>
                </li>
              ))
            )}
          </SearchResults>
          <SearchFooter>
            {searchQuery.trim()
              ? 'Press Enter on a result row or click to go. Esc to close.'
              : 'Popular destinations — type to filter. Keyboard: Ctrl+K / ⌘K to open.'}
          </SearchFooter>
        </SearchPanel>
      </SearchBackdrop>,
      document.body
    );

  return (
    <>
    <HeaderContainer isVisible={isVisible}>
      {canReturnToAdmin && (
        <ImpersonationBar>
          <span>You are signed in as this user (admin view). Session can be restored.</span>
          <ImpersonationBtn type="button" onClick={handleReturnToAdmin}>
            Return to admin account
          </ImpersonationBtn>
        </ImpersonationBar>
      )}
      <NavContainer>
        <LeftSection>
          <MenuToggle
            type="button"
            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileNavOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <>
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                </>
              )}
            </svg>
          </MenuToggle>
          <Logo to="/">
            <LogoImage 
              src={transparentLogo} 
              alt="KimuX Logo"
              style={{ background: 'transparent' }}
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) {
                  e.target.nextSibling.style.display = 'flex';
                }
              }}
            />
            <div style={{ display: 'none', alignItems: 'center', gap: '4px', fontSize: '1.5rem' }}>
              <span style={{ color: '#00C896', fontWeight: '700' }}>K</span>
              <span style={{ color: isDarkMode ? '#FFFFFF' : '#111111', fontWeight: '700' }}>imuntuX</span>
            </div>
          </Logo>
          <MainNav>
            {mainNavItems.map(item => (
              <NavLink key={item.path} to={item.path} className={location.pathname === item.path ? 'active' : ''}>
                {item.label}
              </NavLink>
            ))}
          </MainNav>
        </LeftSection>
        <RightSection>
          <SearchButton
            type="button"
            onClick={openSiteSearch}
            aria-haspopup="dialog"
            aria-expanded={searchOpen}
            aria-controls="site-search-dialog"
          >
            <StyledSearchIcon />
            <BtnLabel>Search</BtnLabel>
          </SearchButton>
          {user ? (
            <>
              <SignInButton onClick={handleLogout}>
                <StyledUserIcon />
                <BtnLabel>Logout</BtnLabel>
              </SignInButton>
              <StartTrialButton to="/crm/dashboard">CRM</StartTrialButton>
            </>
          ) : (
            <>
              <SignInButton as={Link} to="/login">
                <StyledUserIcon />
                <BtnLabel>Sign in</BtnLabel>
              </SignInButton>
              <StartTrialButton to="/signup">Start Free Trial</StartTrialButton>
            </>
          )}
        </RightSection>
      </NavContainer>
    </HeaderContainer>
    {mobileNavOpen && (
      <>
        <MobileNavBackdrop
          $open={mobileNavOpen}
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
        <MobileNavDrawer $open={mobileNavOpen} aria-label="Mobile navigation">
          <MobileNavHeader>
            <MobileNavTitle>Menu</MobileNavTitle>
            <MobileCloseBtn type="button" onClick={() => setMobileNavOpen(false)} aria-label="Close menu">
              ×
            </MobileCloseBtn>
          </MobileNavHeader>
          {mainNavItems.map((item) => (
            <MobileNavLink
              key={item.path}
              to={item.path}
              className={location.pathname === item.path ? 'active' : ''}
              onClick={() => setMobileNavOpen(false)}
            >
              {item.label}
            </MobileNavLink>
          ))}
          <MobileNavActions>
            <MobileActionButton type="button" onClick={() => { openSiteSearch(); setMobileNavOpen(false); }}>
              Search site
            </MobileActionButton>
            {user ? (
              <>
                <MobileActionBtn to="/crm/dashboard" $primary onClick={() => setMobileNavOpen(false)}>
                  Open CRM
                </MobileActionBtn>
                <MobileActionButton type="button" onClick={() => { handleLogout(); setMobileNavOpen(false); }}>
                  Logout
                </MobileActionButton>
              </>
            ) : (
              <>
                <MobileActionBtn to="/signup" $primary onClick={() => setMobileNavOpen(false)}>
                  Start Free Trial
                </MobileActionBtn>
                <MobileActionBtn to="/login" onClick={() => setMobileNavOpen(false)}>
                  Sign in
                </MobileActionBtn>
              </>
            )}
          </MobileNavActions>
        </MobileNavDrawer>
      </>
    )}
    {searchModal}
    </>
  );
};

export default Header;
