# ClaveÚnica logout

This fork of the Login UI ends the [ClaveÚnica](https://claveunica.gob.cl) SSO session whenever a ZITADEL session is
cleared. ClaveÚnica requires this (manual, step 7), and its certification checks it: after logging out, the next
ClaveÚnica login must ask for the RUN and password again.

Upstream ZITADEL cannot do this: federated logout only exists for SAML identity providers, and ClaveÚnica is OIDC.

## Configuration

| Variable                | Value                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `CLAVEUNICA_LOGOUT_URL` | Production: `https://accounts.claveunica.gob.cl/api/v1/accounts/app/logout`<br>Local fake: `http://localhost:9095/api/v1/accounts/app/logout` |

Without the variable, the logout behaves exactly like upstream.

Register one Logout URI at ClaveÚnica per public login host: `https://<login-host><NEXT_PUBLIC_BASE_PATH>/logout/claveunica/done`,
for example `https://auth.example.cl/ui/v2/login/logout/claveunica/done`.

## Flow

1. The ZITADEL session is cleared, as upstream does.
2. The server stores the final destination in the httpOnly cookie `__Host-claveunica_logout_destination` (5 minutes;
   `claveunica_logout_destination` outside production, because `__Host-` requires Secure). The prefix stops a sibling
   subdomain from planting a destination. The
   destination is the `post_logout_redirect_uri` of the signed logout token, verified again on the server, or
   `/logout/done?organization=...` when there is none.
3. The browser navigates to `${CLAVEUNICA_LOGOUT_URL}?redirect=<login>/logout/claveunica/done`.
4. ClaveÚnica ends its session and returns to `/logout/claveunica/done`, which deletes the cookie and redirects to
   the destination. Without the cookie it redirects to `/logout/done`. Query parameters are never used as a
   destination.

The jump happens on every logout, whichever identity provider the person used. Without a ClaveÚnica session, its
logout does nothing. The Google session is not touched.

If ClaveÚnica cannot be reached, the ZITADEL session is already gone: the logout is never conditional on ClaveÚnica.

## Testing with the fake

Run [fakeclaveunica](https://github.com/Kafeiih/fakeclaveunica) with `FAKECU_SSO_TTL` above 60 seconds. With 60
seconds the fake session expires on its own and hides a missing logout.
