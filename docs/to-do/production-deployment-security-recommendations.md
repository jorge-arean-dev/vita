# Production Deployment Security Recommendations

## Overview
This document outlines security best practices for deploying webhook endpoints to production, based on lessons learned from the Interview Companion Recall.ai integration.

## Current Development Setup Issues

### ❌ Problems with Preview Deployment Approach
1. **Disabled Authentication Protection**
   - Exposes entire deployment publicly
   - Removes important security barriers
   - Could expose sensitive pages/data to unauthorized access

2. **Preview Deployment URLs for Webhooks**
   - URLs change with every deployment (`vita-qhq3z05ke-...` is temporary)
   - Webhooks break when deploying new changes
   - Not reliable for production services

## Production-Ready Solutions

### Option 1: Use Production Domain with Path-Based Security ⭐ **RECOMMENDED**

```bash
# Deploy to production
vercel --prod

# Configure stable webhook URL
https://your-production-domain.com/api/recall/webhooks
```

**Benefits:**
- ✅ Stable URL that doesn't change
- ✅ Production-grade reliability
- ✅ Better for external service integrations

### Option 2: Implement Webhook-Specific Authentication

```typescript
// In your webhook route (already implemented)
export async function POST(request: NextRequest) {
  // Verify Recall.ai webhook signature
  if (!verifyWebhookSignature(request, body)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Process webhook...
}
```

**Current Status:** ✅ Already implemented via Svix signature verification

### Option 3: Use Dedicated Webhook Subdomain

Set up separate subdomain for webhooks:
- `webhooks.your-domain.com/api/recall/webhooks`
- Keep main app protected
- Expose only webhook endpoints

### Option 4: Environment-Based Protection via Middleware

```typescript
// middleware.ts - exclude webhook paths from auth
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/recall/webhooks')) {
    return NextResponse.next() // Skip auth for webhooks
  }
  // Apply normal auth protection for other routes
}
```

## Recommended Production Setup

### 1. Deploy to Production Domain
- Use stable production URL instead of preview deployments
- Configure custom domain if needed
- Ensures webhook reliability

### 2. Maintain Authentication Protection
- Keep Vercel authentication protection enabled for main app
- Only expose webhook endpoints publicly

### 3. Exclude Webhook Paths from Auth
- Use middleware approach to exclude `/api/recall/webhooks` from authentication
- Maintains security for rest of application

### 4. Rely on Webhook Signature Verification
- Current Svix implementation provides strong security
- Validates requests come from legitimate Recall.ai webhooks
- Prevents unauthorized webhook abuse

### 5. Implement Monitoring
- Monitor webhook endpoints for suspicious activity
- Set up alerts for failed webhook processing
- Log webhook events for debugging and security audit

## Security Checklist

### Before Production Deployment:

- [ ] Deploy to stable production domain
- [ ] Re-enable Vercel authentication protection
- [ ] Configure middleware to exclude webhook paths
- [ ] Verify webhook signature verification is working
- [ ] Test complete webhook flow in production environment
- [ ] Set up monitoring and alerting
- [ ] Document webhook URL for external services
- [ ] Create incident response plan for webhook failures

### Environment Variables:
- [ ] `RECALL_API_KEY` - Set in production environment
- [ ] `RECALL_WEBHOOK_SECRET` - Matches Recall.ai dashboard configuration
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - For database operations

## Implementation Priority

### Phase 1: Immediate (Before Production)
1. Deploy to production domain
2. Update webhook URL in Recall.ai dashboard
3. Re-enable authentication protection

### Phase 2: Security Hardening
1. Implement middleware-based webhook exclusion
2. Add webhook monitoring and logging
3. Create security incident response procedures

### Phase 3: Optimization
1. Consider dedicated webhook subdomain
2. Implement rate limiting for webhook endpoints
3. Add webhook retry logic and dead letter queues

## Related Files
- `/app/api/recall/webhooks/route.ts` - Webhook implementation
- `/middleware.ts` - Authentication and routing
- `/docs/to-do/recall-ai-integration-plan.md` - Integration details

## Notes
- Current implementation works but needs security improvements for production
- Webhook signature verification provides good baseline security
- Focus on stable URLs and proper authentication boundaries