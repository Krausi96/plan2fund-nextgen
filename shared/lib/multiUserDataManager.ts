type Client = { id: string; name: string }
type Plan = { id: string; clientId?: string }

class MultiUserDataManager {
  private static instance: MultiUserDataManager
  private constructor() {}
  static getInstance() {
    if (!this.instance) this.instance = new MultiUserDataManager()
    return this.instance
  }
  listClients(): Client[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('pf_clients') || '[]') } catch { return [] }
  }
  saveClient(client: Client) {
    if (typeof window === 'undefined') return;
    const all = this.listClients()
    const idx = all.findIndex(c => c.id === client.id)
    if (idx >= 0) all[idx] = client; else all.push(client)
    localStorage.setItem('pf_clients', JSON.stringify(all))
  }
  assignPlanToClient(plan: Plan, clientId: string) {
    if (typeof window === 'undefined') return;
    try {
      const plans: any[] = JSON.parse(localStorage.getItem('userPlans') || '[]')
      const idx = plans.findIndex(p => p.id === plan.id)
      if (idx >= 0) plans[idx].clientId = clientId
      localStorage.setItem('userPlans', JSON.stringify(plans))
    } catch {}
  }
}

export const multiUserDataManager = MultiUserDataManager.getInstance();



