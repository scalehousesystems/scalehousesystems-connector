const fetch = require('node-fetch');

class API {
  constructor(endpoint, apiKey) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  async testConnection() {
    const response = await fetch(`${this.endpoint}/api/connector/test`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API test failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async sendAuditEvents(events) {
    const response = await fetch(`${this.endpoint}/api/connector/audit-events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        events: events.map(event => ({
          id: event.SecurityLogNum,
          permType: event.PermType,
          userId: event.UserNum,
          foreignKey: event.FKey,
          logText: event.LogText,
          computerName: event.CompName,
          timestamp: event.DateTStamp
        }))
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  async getConfiguration() {
    const response = await fetch(`${this.endpoint}/api/connector/config`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get configuration: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async reportStatus(status) {
    const response = await fetch(`${this.endpoint}/api/connector/status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to report status: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }
}

module.exports = API;
