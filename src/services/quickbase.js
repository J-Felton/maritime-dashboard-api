/**
 * QuickBase API Service
 * Handles all QuickBase interactions
 * API keys stored as Cloudflare Worker secrets (never exposed to frontend)
 */

 export class QuickBaseService {
  constructor(env) {
    this.realm = env.QUICKBASE_REALM;
    this.userToken = env.QUICKBASE_USER_TOKEN; // Secret
    this.baseUrl = `https://api.quickbase.com/v1`;
  }

  /**
   * Make authenticated request to QuickBase
   */
  async makeRequest(endpoint, method = 'GET', body = null) {
    const headers = {
      'QB-Realm-Hostname': this.realm,
      'Authorization': `QB-USER-TOKEN ${this.userToken}`,
      'Content-Type': 'application/json'
    };

    const options = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`QuickBase API Error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get client information by Clerk User ID
   * This ensures users can only see their own data
   */
  async getClientByClerkId(clerkUserId) {
    const query = {
      from: "bq7xyz123", // Replace with your Clients table ID
      where: `{6.EX.'${clerkUserId}'}`, // Field 6 = Clerk User ID field
      select: [3, 6, 7, 8, 9, 10] // Field IDs for client data
    };

    return this.makeRequest('/records/query', 'POST', query);
  }

  /**
   * Get vessels for a specific client
   */
  async getVesselsByClientId(clientRecordId) {
    const query = {
      from: "bq8abc456", // Replace with your Vessels table ID
      where: `{7.EX.${clientRecordId}}`, // Field 7 = Related Client field
      select: [3, 6, 8, 9, 10, 11, 12] // Vessel data fields
    };

    return this.makeRequest('/records/query', 'POST', query);
  }

  /**
   * Update client contact information
   * Only allows updating specific fields
   */
  async updateClientContact(clientRecordId, updates) {
    // Whitelist of fields that can be updated
    const allowedFields = {
      email: 8,      // Field 8 = Email
      phone: 9,      // Field 9 = Phone
      address: 10    // Field 10 = Address
    };

    const data = {
      to: "bq7xyz123", // Clients table ID
      data: [{
        "3": { value: clientRecordId }, // Record ID field
        ...Object.entries(updates).reduce((acc, [key, value]) => {
          if (allowedFields[key]) {
            acc[allowedFields[key]] = { value };
          }
          return acc;
        }, {})
      }]
    };

    return this.makeRequest('/records', 'POST', data);
  }

  /**
   * Update vessel active/inactive status
   */
  async updateVesselStatus(vesselRecordId, clientRecordId, isActive) {
    // First verify the vessel belongs to this client
    const vessel = await this.getVesselById(vesselRecordId);
    
    if (vessel.data<a href="" class="citation-link" target="_blank" style="vertical-align: super; font-size: 0.8em; margin-left: 3px;">[0]</a>["7"].value !== clientRecordId) {
      throw new Error('Unauthorized: Vessel does not belong to this client');
    }

    const data = {
      to: "bq8abc456", // Vessels table ID
      data: [{
        "3": { value: vesselRecordId },
        "12": { value: isActive } // Field 12 = Active Status
      }]
    };

    return this.makeRequest('/records', 'POST', data);
  }

  /**
   * Get single vessel (for verification)
   */
  async getVesselById(vesselRecordId) {
    const query = {
      from: "bq8abc456",
      where: `{3.EX.${vesselRecordId}}`,
      select: [3, 7] // Just ID and Client relationship
    };

    return this.makeRequest('/records/query', 'POST', query);
  }
}
