import { Hono } from 'hono';
import { QuickBaseService } from '../services/quickbase.js';

const users = new Hono();

/**
 * GET /api/users/me
 * Get current user's information
 */
users.get('/me', async (c) => {
  const clerkUserId = c.get('clerkUserId');
  const qb = new QuickBaseService(c.env);

  try {
    const clientData = await qb.getClientByClerkId(clerkUserId);
    
    if (!clientData.data || clientData.data.length === 0) {
      return c.json({ error: 'Client not found' }, 404);
    }

    // Transform QuickBase response to friendly format
    const client = clientData.data<a href="" class="citation-link" target="_blank" style="vertical-align: super; font-size: 0.8em; margin-left: 3px;">[0]</a>;
    const response = {
      recordId: client["3"].value,
      clerkId: client["6"].value,
      companyName: client["7"].value,
      email: client["8"].value,
      phone: client["9"].value,
      address: client["10"].value
    };

    return c.json(response);
  } catch (error) {
    console.error('Error fetching user:', error);
    return c.json({ error: 'Failed to fetch user data' }, 500);
  }
});

/**
 * PATCH /api/users/me
 * Update current user's contact information
 */
users.patch('/me', async (c) => {
  const clerkUserId = c.get('clerkUserId');
  const updates = await c.req.json();
  const qb = new QuickBaseService(c.env);

  try {
    // Get client record ID
    const clientData = await qb.getClientByClerkId(clerkUserId);
    
    if (!clientData.data || clientData.data.length === 0) {
      return c.json({ error: 'Client not found' }, 404);
    }

    const clientRecordId = clientData.data<a href="" class="citation-link" target="_blank" style="vertical-align: super; font-size: 0.8em; margin-left: 3px;">[0]</a>["3"].value;

    // Update only allowed fields
    const allowedUpdates = {};
    if (updates.email) allowedUpdates.email = updates.email;
    if (updates.phone) allowedUpdates.phone = updates.phone;
    if (updates.address) allowedUpdates.address = updates.address;

    const result = await qb.updateClientContact(clientRecordId, allowedUpdates);

    return c.json({ 
      success: true, 
      message: 'Contact information updated',
      data: result 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return c.json({ error: 'Failed to update user data' }, 500);
  }
});

export default users;
