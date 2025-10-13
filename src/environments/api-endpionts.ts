const BASE_URL = '/v1';

export const API_ENDPOINTS = {
  auth: {
    login: `${BASE_URL}/auth/login`,
    logout: `${BASE_URL}/auth/logout`,
    register: `${BASE_URL}/auth/register`,
    refresh: `${BASE_URL}/auth/refresh`,
    switchRoles: {
      select: `${BASE_URL}/auth/switch-roles/select`,
      toClient: `${BASE_URL}/auth/switch-roles/client`,
    },
  },

  categories: {
    base: `${BASE_URL}/categories`,
    byId: (id: string) => `${BASE_URL}/categories/${id}`,
  },

  employees: {
    base: `${BASE_URL}/employments`,
    byId: (id: string) => `${BASE_URL}/employments/${id}`,
    byUserEmail: (email: string) => `${BASE_URL}/employments/user/${email}`,
    actives: `${BASE_URL}/employments/actives`,
    deleted: `${BASE_URL}/employments/deleted`,
  },

  foodVenues: {
    current: `${BASE_URL}/food-venues/current`,
    admin: {
      current: `${BASE_URL}/food-venues/admin/current`,
    },
    root: {
      base: `${BASE_URL}/food-venues/root`,
      byId: (id: string) => `${BASE_URL}/food-venues/root/${id}`,
      deleted: `${BASE_URL}/food-venues/root/deleted`,
    },
    public: {
      base: `${BASE_URL}/public/food-venues`,
      menu: (foodVenueId: string) =>
        `${BASE_URL}/public/food-venues/${foodVenueId}/menu`,
    },
  },

  me: {
    profile: `${BASE_URL}/me/profile`,
    orders: `${BASE_URL}/me/orders`,
    tableSessions: {
      base: `${BASE_URL}/me/table-sessions`,
      asHost: `${BASE_URL}/me/table-sessions/host`,
      asParticipant: `${BASE_URL}/me/table-sessions/participant`,
    },
  },

  menu: {
    base: `${BASE_URL}/menus`,
  },

  metrics: {
    general: {
      overview: `${BASE_URL}/metrics/general/overview`,
      revenue: `${BASE_URL}/metrics/general/revenue`,
      orders: `${BASE_URL}/metrics/general/orders`,
      topVenues: `${BASE_URL}/metrics/general/top-venues`,
    },
    foodVenue: {
      overview: `${BASE_URL}/metrics/food-venue/overview`,
      sales: `${BASE_URL}/metrics/food-venue/sales`,
      topProducts: `${BASE_URL}/metrics/food-venue/top-products`,
    },
  },

  orders: {
    base: `${BASE_URL}/orders`,
    byId: (id: string) => `${BASE_URL}/orders/${id}`,
    byDateAndNumber: (date: string, orderNumber: number) =>
      `${BASE_URL}/orders/by-date/${date}/number/${orderNumber}`,
    today: `${BASE_URL}/orders/today`,
    cancel: (id: string) => `${BASE_URL}/orders/${id}/cancel`,
    updateStatus: (id: string) => `${BASE_URL}/orders/${id}/status`,
    updateRequirements: (id: string) => `${BASE_URL}/orders/${id}/requirements`,
  },

  participants: {
    currentSession: `${BASE_URL}/participants/table-sessions`,
    currentOrders: `${BASE_URL}/participants/orders`,
    currentPayments: `${BASE_URL}/participants/payments`,
    currentSessionPayments: `${BASE_URL}/participants/table-sessions/payments`,
    delegateHost: (participantId: string) =>
      `${BASE_URL}/participants/host/${participantId}`,
    endSession: `${BASE_URL}/participants/end`,
  },

  payments: {
    base: `${BASE_URL}/payments`,
    byId: (id: string) => `${BASE_URL}/payments/${id}`,
    byTableSession: (tableSessionId: string) =>
      `${BASE_URL}/payments/table-session/${tableSessionId}`,
    byContext: `${BASE_URL}/payments/context`,
    byOrders: `${BASE_URL}/payments/orders`,
    today: `${BASE_URL}/payments/today`,
    complete: (id: string) => `${BASE_URL}/payments/${id}/complete`,
    cancel: (id: string) => `${BASE_URL}/payments/${id}/cancel`,
  },

  products: {
    base: `${BASE_URL}/products`,
    byId: (id: string) => `${BASE_URL}/products/find-by-id/${id}`,
    byName: (productName: string) =>
      `${BASE_URL}/products/find-by-name/${productName}`,
    available: `${BASE_URL}/products/available`,
    topSelling: `${BASE_URL}/products/top-selling`,
    delete: (id: string) => `${BASE_URL}/products/${id}`,
    patch: (id: string) => `${BASE_URL}/products/${id}`,
    featured: {
      register: `${BASE_URL}/products/featured/register`,
      all: `${BASE_URL}/products/featured/all`,
      actives: `${BASE_URL}/products/featured/actives`,
      byId: (id: string) => `${BASE_URL}/products/featured/id/${id}`,
      byProductName: (productName: string) =>
        `${BASE_URL}/products/featured/products/${productName}`,
      enable: (productName: string) =>
        `${BASE_URL}/products/featured/products/${productName}/on`,
      disable: (productName: string) =>
        `${BASE_URL}/products/featured/products/${productName}/off`,
    },
  },

  root: {
    base: `${BASE_URL}/root/all`,
    register: `${BASE_URL}/root/register`,
    selectContext: `${BASE_URL}/root/select-context`,
    users: {
      actives: `${BASE_URL}/root/users/actives`,
      deleted: `${BASE_URL}/root/users/deleted`,
      all: `${BASE_URL}/root/users/all`,
      byId: (id: string) => `${BASE_URL}/root/users/${id}`,
    },
    admins: {
      base: `${BASE_URL}/root/admins`,
      all: `${BASE_URL}/root/admins/all`,
      actives: `${BASE_URL}/root/admins/actives`,
      removed: `${BASE_URL}/root/admins/removed`,
      byId: (id: string) => `${BASE_URL}/root/admins/id/${id}`,
      byEmail: (email: string) => `${BASE_URL}/root/admins/email/${email}`,
      deleteById: (id: string) => `${BASE_URL}/root/admins/${id}`,
      patchById: (id: string) => `${BASE_URL}/root/admins/${id}`,
    },
  },

  tables: {
    base: `${BASE_URL}/tables`,
    byId: (id: string) => `${BASE_URL}/tables/${id}`,
    byNumber: (number: number) => `${BASE_URL}/tables/number/${number}`,
    filter: `${BASE_URL}/tables/filter`,
    updateStatus: (id: string) => `${BASE_URL}/tables/status/${id}`,
  },

  tableSessions: {
    base: `${BASE_URL}/table-sessions`,
    scanQr: `${BASE_URL}/table-sessions/scan-qr`,
    byId: (id: string) => `${BASE_URL}/table-sessions/${id}`,
    active: `${BASE_URL}/table-sessions/active`,
    byTableNumber: (tableNumber: number) =>
      `${BASE_URL}/table-sessions/table/${tableNumber}`,
    byTableAndTime: (tableNumber: number) =>
      `${BASE_URL}/table-sessions/table/${tableNumber}/time-range`,
    byParticipant: (clientId: string) =>
      `${BASE_URL}/table-sessions/participant/${clientId}`,
    byHost: (clientId: string) => `${BASE_URL}/table-sessions/host/${clientId}`,
    latestByTable: (tableId: string) =>
      `${BASE_URL}/table-sessions/latest/${tableId}`,
    endSession: (tableId: string) =>
      `${BASE_URL}/table-sessions/end/${tableId}`,
    addClient: (sessionId: string, clientId: string) =>
      `${BASE_URL}/table-sessions/${sessionId}/clients/${clientId}`,
    orders: (sessionId: string) =>
      `${BASE_URL}/table-sessions/${sessionId}/orders`,
    root: {
      base: `${BASE_URL}/table-sessions/root`,
    },
  },

  tags: {
    base: `${BASE_URL}/tags`,
  },
};
