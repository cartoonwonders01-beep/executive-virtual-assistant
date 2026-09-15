/**
 * Ephemeral Session Grant Manager
 * Issues and validates short-lived scoped access tokens (AGNT-GRANT-XXXX)
 * for companion apps and external mobile agents without leaking master credentials.
 */

export interface EphemeralGrant {
  id: string;
  token: string;
  scope: 'memory:read' | 'calendar:stage' | 'assistant:full';
  issuedAt: number;
  expiresAt: number;
  revoked: boolean;
}

export class EphemeralGrantManager {
  private grants: Map<string, EphemeralGrant> = new Map();
  private readonly DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes

  /**
   * Generates a new short-lived ephemeral grant
   */
  public createGrant(
    scope: EphemeralGrant['scope'] = 'assistant:full',
    ttlMs: number = this.DEFAULT_TTL_MS
  ): EphemeralGrant {
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    const token = `AGNT-GRANT-${randomHex}`;
    const id = 'grt-' + Date.now();
    const now = Date.now();

    const grant: EphemeralGrant = {
      id,
      token,
      scope,
      issuedAt: now,
      expiresAt: now + ttlMs,
      revoked: false
    };

    this.grants.set(token, grant);
    return grant;
  }

  /**
   * Validates an ephemeral token against expiry, revocation, and scope
   */
  public validateGrant(
    token: string,
    requiredScope?: EphemeralGrant['scope']
  ): { valid: boolean; reason?: string; grant?: EphemeralGrant } {
    if (!token || !token.startsWith('AGNT-GRANT-')) {
      return { valid: false, reason: 'Invalid token format' };
    }

    const grant = this.grants.get(token);
    if (!grant) {
      return { valid: false, reason: 'Grant not found' };
    }

    if (grant.revoked) {
      return { valid: false, reason: 'Grant has been revoked' };
    }

    if (Date.now() > grant.expiresAt) {
      return { valid: false, reason: 'Grant has expired' };
    }

    if (requiredScope && grant.scope !== 'assistant:full' && grant.scope !== requiredScope) {
      return { valid: false, reason: `Insufficient scope: required ${requiredScope}, got ${grant.scope}` };
    }

    return { valid: true, grant };
  }

  /**
   * Revokes an existing token immediately
   */
  public revokeGrant(token: string): boolean {
    const grant = this.grants.get(token);
    if (!grant) return false;
    grant.revoked = true;
    return true;
  }

  /**
   * Prunes expired grants to keep memory footprint lean
   */
  public pruneExpired(): number {
    const now = Date.now();
    let pruned = 0;
    for (const [token, grant] of this.grants.entries()) {
      if (now > grant.expiresAt || grant.revoked) {
        this.grants.delete(token);
        pruned++;
      }
    }
    return pruned;
  }

  public getActiveGrantCount(): number {
    const now = Date.now();
    return Array.from(this.grants.values()).filter(g => !g.revoked && now <= g.expiresAt).length;
  }

  public clearAll(): void {
    this.grants.clear();
  }
}

export const ephemeralGrantManager = new EphemeralGrantManager();
