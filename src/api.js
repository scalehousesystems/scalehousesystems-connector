const fetch = require('node-fetch');

const DEFAULT_API_ENDPOINT = 'https://api.scalehousesystems.com';

async function testConnection(apiKey, apiEndpoint = DEFAULT_API_ENDPOINT) {
  try {
    const response = await fetch(`${apiEndpoint}/v1/connector/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.ok) {
      const data = await response.json();
      return `API connection successful! ${data.message || 'Connected'}`;
    } else {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }
  } catch (error) {
    throw new Error(`API test failed: ${error.message}`);
  }
}

async function sendAuditEvents(apiKey, apiEndpoint = DEFAULT_API_ENDPOINT, events) {
  try {
    const response = await fetch(`${apiEndpoint}/v1/connector/audit-events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: 'opendental',
        events: events.map(event => ({
          id: event.AuditLogNum,
          patientNum: event.PatNum,
          userNum: event.UserNum,
          timestamp: event.LogDateTime,
          text: event.LogText,
          permType: event.PermType
        }))
      }),
      timeout: 30000
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const errorText = await response.text();
      console.error('API error:', errorText);
      return { 
        success: false, 
        error: `API returned ${response.status}: ${errorText}` 
      };
    }
  } catch (error) {
    console.error('Failed to send events:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

module.exports = {
  testConnection,
  sendAuditEvents,
  DEFAULT_API_ENDPOINT
};
