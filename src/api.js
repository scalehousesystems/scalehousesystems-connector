/**
 * ScaleHouse API Client
 * 
 * Handles communication with the ScaleHouse compliance platform API.
 * Sends audit data collected from OpenDental database.
 */

const fetch = require('node-fetch');

class ScaleHouseAPI {
  constructor(apiKey, apiUrl) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl || 'https://api.scalehousesystems.com';
  }

  /**
   * Send audit data to ScaleHouse platform
   * 
   * @param {Object} auditData - The audit data to send
   * @returns {Object} API response
   */
  async sendAuditData(auditData) {
    const url = `${this.apiUrl}/v1/audit-events`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Connector-Version': '1.0.0'
        },
        body: JSON.stringify(auditData)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      console.log(`✅ Sent ${result.recordsProcessed || 0} audit records to ScaleHouse`);
      
      return result;
    } catch (error) {
      console.error('❌ Failed to send audit data:', error.message);
      throw error;
    }
  }

  /**
   * Verify API key and connection
   * 
   * @returns {Object} Verification result
   */
  async verifyConnection() {
    const url = `${this.apiUrl}/v1/verify`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`API verification failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ ScaleHouse API connection verified');
      
      return result;
    } catch (error) {
      console.error('❌ API verification failed:', error.message);
      throw error;
    }
  }

  /**
   * Send heartbeat to indicate connector is running
   * 
   * @returns {Object} Heartbeat response
   */
  async sendHeartbeat() {
    const url = `${this.apiUrl}/v1/heartbeat`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          timestamp: new Date(),
          version: '1.0.0',
          status: 'running'
        })
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      // Heartbeat failures are non-critical
      console.log('Heartbeat failed (non-critical):', error.message);
    }
  }
}

module.exports = ScaleHouseAPI;
