// Notification System - Real-time alerts for data pipeline
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface Notification {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  layer: 'scraper' | 'pipeline' | 'api' | 'system';
  resolved: boolean;
  data?: any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  
  if (method === 'GET') {
    return getNotifications(req, res);
  } else if (method === 'POST') {
    return createNotification(req, res);
  } else if (method === 'PUT') {
    return updateNotification(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getNotifications(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { level, layer, resolved, limit = '50' } = req.query;
    
    const notificationsFile = path.join(process.cwd(), 'data', 'notifications.json');
    let notifications: Notification[] = [];
    
    if (fs.existsSync(notificationsFile)) {
      notifications = JSON.parse(fs.readFileSync(notificationsFile, 'utf-8'));
    }
    
    // Filter notifications
    let filtered = notifications;
    
    if (level) {
      filtered = filtered.filter(n => n.level === level);
    }
    
    if (layer) {
      filtered = filtered.filter(n => n.layer === layer);
    }
    
    if (resolved !== undefined) {
      const isResolved = resolved === 'true';
      filtered = filtered.filter(n => n.resolved === isResolved);
    }
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Limit results
    const limitNum = parseInt(limit as string);
    filtered = filtered.slice(0, limitNum);
    
    // Get summary stats
    const stats = {
      total: notifications.length,
      unresolved: notifications.filter(n => !n.resolved).length,
      byLevel: {
        error: notifications.filter(n => n.level === 'error').length,
        warning: notifications.filter(n => n.level === 'warning').length,
        info: notifications.filter(n => n.level === 'info').length,
        success: notifications.filter(n => n.level === 'success').length
      },
      byLayer: {
        scraper: notifications.filter(n => n.layer === 'scraper').length,
        pipeline: notifications.filter(n => n.layer === 'pipeline').length,
        api: notifications.filter(n => n.layer === 'api').length,
        system: notifications.filter(n => n.layer === 'system').length
      }
    };
    
    res.status(200).json({
      notifications: filtered,
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get notifications',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function createNotification(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { level, message, layer, data } = req.body;
    
    if (!level || !message || !layer) {
      return res.status(400).json({ error: 'Missing required fields: level, message, layer' });
    }
    
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      layer,
      resolved: false,
      data
    };
    
    const notificationsFile = path.join(process.cwd(), 'data', 'notifications.json');
    let notifications: Notification[] = [];
    
    if (fs.existsSync(notificationsFile)) {
      notifications = JSON.parse(fs.readFileSync(notificationsFile, 'utf-8'));
    }
    
    notifications.unshift(notification);
    
    // Keep only last 1000 notifications
    if (notifications.length > 1000) {
      notifications = notifications.slice(0, 1000);
    }
    
    fs.writeFileSync(notificationsFile, JSON.stringify(notifications, null, 2));
    
    res.status(201).json({
      success: true,
      notification,
      message: 'Notification created'
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create notification',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function updateNotification(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, resolved } = req.body;
    
    if (!id || resolved === undefined) {
      return res.status(400).json({ error: 'Missing required fields: id, resolved' });
    }
    
    const notificationsFile = path.join(process.cwd(), 'data', 'notifications.json');
    let notifications: Notification[] = [];
    
    if (fs.existsSync(notificationsFile)) {
      notifications = JSON.parse(fs.readFileSync(notificationsFile, 'utf-8'));
    }
    
    const notificationIndex = notifications.findIndex(n => n.id === id);
    
    if (notificationIndex === -1) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    notifications[notificationIndex].resolved = resolved;
    
    fs.writeFileSync(notificationsFile, JSON.stringify(notifications, null, 2));
    
    res.status(200).json({
      success: true,
      notification: notifications[notificationIndex],
      message: 'Notification updated'
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update notification',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
