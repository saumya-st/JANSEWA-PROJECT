import { describe, expect, it } from 'vitest';
import { ROLES, getDefaultRoute, hasAccess } from './roleRoutes';

describe('hasAccess', () => {
  it('allows every role on the shared dashboard', () => {
    for (const role of Object.values(ROLES)) {
      expect(hasAccess(role, '/dashboard')).toBe(true);
    }
  });

  it('restricts citizen-only routes', () => {
    expect(hasAccess(ROLES.CITIZEN, '/report')).toBe(true);
    expect(hasAccess(ROLES.CITIZEN, '/my-issues')).toBe(true);
    expect(hasAccess(ROLES.ENGINEER, '/report')).toBe(false);
    expect(hasAccess(ROLES.SUPERVISOR, '/my-issues')).toBe(false);
  });

  it('restricts engineer-only routes, including dynamic segments', () => {
    expect(hasAccess(ROLES.ENGINEER, '/assigned')).toBe(true);
    expect(hasAccess(ROLES.ENGINEER, '/issue/abc123/update')).toBe(true);
    expect(hasAccess(ROLES.CITIZEN, '/issue/abc123/update')).toBe(false);
    expect(hasAccess(ROLES.SUPERVISOR, '/assigned')).toBe(false);
  });

  it('restricts the map to supervisors', () => {
    expect(hasAccess(ROLES.SUPERVISOR, '/map')).toBe(true);
    expect(hasAccess(ROLES.CITIZEN, '/map')).toBe(false);
  });

  it('lets every role open issue details', () => {
    for (const role of Object.values(ROLES)) {
      expect(hasAccess(role, '/issue/xyz')).toBe(true);
    }
  });

  it('treats routes without a rule as public', () => {
    expect(hasAccess(ROLES.CITIZEN, '/unauthorized')).toBe(true);
    expect(hasAccess(undefined, '/login')).toBe(true);
  });

  it('does not let a dynamic pattern match deeper paths', () => {
    // "/issue/:id" and "/issue/:id/update" must not match an extra segment.
    expect(hasAccess(ROLES.CITIZEN, '/issue/x/update/extra')).toBe(true);
  });
});

describe('getDefaultRoute', () => {
  it('maps each role to its landing page', () => {
    expect(getDefaultRoute(ROLES.CITIZEN)).toBe('/dashboard');
    expect(getDefaultRoute(ROLES.ENGINEER)).toBe('/assigned');
    expect(getDefaultRoute(ROLES.SUPERVISOR)).toBe('/map');
  });

  it('falls back to login for unknown roles', () => {
    expect(getDefaultRoute('admin')).toBe('/login');
    expect(getDefaultRoute(undefined)).toBe('/login');
  });
});
