import { NextRequest, NextResponse } from 'next/server';
import { serviceConfig } from '@/lib/services/config';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = serviceConfig.getServiceStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Service config API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service configuration' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serviceName, url } = await request.json();
    
    if (!serviceName || !url) {
      return NextResponse.json(
        { error: 'Service name and URL are required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Update service URL
    serviceConfig.updateServiceUrl(serviceName, url);

    return NextResponse.json({ 
      message: `Service ${serviceName} URL updated successfully`,
      newUrl: url
    });
  } catch (error) {
    console.error('Service config update error:', error);
    return NextResponse.json(
      { error: 'Failed to update service configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();
    
    switch (action) {
      case 'validate':
        const validation = serviceConfig.validateServiceConfiguration();
        return NextResponse.json(validation);
      
      case 'reinitialize':
        await serviceConfig.initializeServices();
        return NextResponse.json({ message: 'Services reinitialized successfully' });
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Service config action error:', error);
    return NextResponse.json(
      { error: 'Failed to process service configuration action' },
      { status: 500 }
    );
  }
}