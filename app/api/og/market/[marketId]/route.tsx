import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';
import { getCachedMarket } from '@/lib/kv';

export const runtime = 'edge';

/**
 * GET /api/og/market/[marketId]
 * Generate OG image for market
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { marketId: string } }
) {
  try {
    const { marketId } = params;

    // Get market details from cache
    const market = await getCachedMarket(marketId);
    
    if (!market) {
      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1a1a1a',
              color: 'white',
              fontSize: 48,
            }}
          >
            Market not found
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Calculate time remaining
    const now = Date.now();
    const endTime = market.endTime * 1000;
    const timeRemaining = endTime - now;
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
    const daysRemaining = Math.floor(hoursRemaining / 24);
    
    let timeText = '';
    if (timeRemaining <= 0) {
      timeText = 'Ended';
    } else if (daysRemaining > 0) {
      timeText = `${daysRemaining}d remaining`;
    } else {
      timeText = `${hoursRemaining}h remaining`;
    }

    // Format total pool
    const totalPoolEth = (parseFloat(market.totalPool) / 1e18).toFixed(2);

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: '#0f172a',
            padding: '60px',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: '#3b82f6',
              }}
            >
              🎯 Prediction Market
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 56,
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '30px',
              lineHeight: 1.2,
              display: 'flex',
            }}
          >
            {market.title}
          </div>

          {/* Outcomes */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              marginBottom: '40px',
            }}
          >
            {market.outcomes.slice(0, 3).map((outcome, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#1e293b',
                  padding: '20px 30px',
                  borderRadius: '12px',
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    color: 'white',
                    display: 'flex',
                  }}
                >
                  {outcome.name}
                </div>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 'bold',
                    color: '#3b82f6',
                    display: 'flex',
                  }}
                >
                  {outcome.odds.toFixed(2)}x
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 'auto',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  fontSize: 20,
                  color: '#94a3b8',
                  display: 'flex',
                }}
              >
                Total Pool
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 'bold',
                  color: 'white',
                  display: 'flex',
                }}
              >
                {totalPoolEth} ETH
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  fontSize: 20,
                  color: '#94a3b8',
                  display: 'flex',
                }}
              >
                Participants
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 'bold',
                  color: 'white',
                  display: 'flex',
                }}
              >
                {market.participantCount}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  fontSize: 20,
                  color: '#94a3b8',
                  display: 'flex',
                }}
              >
                Time
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 'bold',
                  color: timeRemaining <= 0 ? '#ef4444' : '#10b981',
                  display: 'flex',
                }}
              >
                {timeText}
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error: any) {
    console.error('OG image generation error:', error);
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a1a1a',
            color: 'white',
            fontSize: 48,
          }}
        >
          Error generating image
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
