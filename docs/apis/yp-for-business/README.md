# YP for Business

2 workflows, 48 endpoints, 855 bindings.

Start URL: `https://ypforbusiness.yellowpages.ca/`  
Generated: `2026-11-04T21:56:19.444Z`

> Values in this document are redacted. Examples keep structure and drop secrets, tokens, emails and identifiers that look like them.

## Coverage

| Measure | Value |
| --- | --- |
| Steps that triggered requests | 34 of 35 |
| Endpoints with a response example | 49 of 65 |
| Bindings between endpoints | 855 |
| Workflow inputs found in requests | 0 |
| Computed values | 36 |
| Bodies evicted before they could be read | 49 |
| Requests between steps | 0 |

| Run | Outcome | Trace | Derive |
| --- | --- | --- | --- |
| `20261104T213155Z-b350` | completed | complete | used |
| `20261104T213305Z-c3db` | completed | complete | used |
| `20261104T213727Z-251f` | completed | complete | used |
| `20261104T213945Z-3040` | completed | complete | used |
| `20261104T214824Z-f674` | completed | complete | used |

## Auth

- Cookies: `SimpleSAMLAuthToken`, `__stripe_mid`, `__stripe_sid`, `adminhtml`, `fs_lua`, `fs_uid`
- Headers: none
- Context headers (constant on most requests, not credentials): none
- Also sent, not needed (analytics and chat SDKs): `ajs_anonymous_id`, `ajs_group_id`, `ajs_user_id`
- Established by: not declared
- Verification: not declared

## 2 workflows

### YP Metrics tour

From the signed-in portal, open the YP Metrics app through its SSO link and read every dashboard, section tab and report view it lists.

- Effect: read
- Latest run: `20261104T214824Z-f674`, completed, 2026-11-04T21:56:19.444Z
- Precondition: signed in to the portal

1. `open-portal` Open https://ypforbusiness.yellowpages.ca/ (ok)
   - `GET /` → 200
   - `GET /bc/v1/app-services/url/analytics/{analyticId}` → 200
   - `GET /bc/v1/app-services/merchant/{merchantId}/assets` → 200
   - `GET /bc/v1/app-services/merchant/{merchantId}/assets` → 200
   - `GET /bc/v1/app-services/account/{accountId}/bank-hours` → 200
   - `GET /bc/v1/app-services/merchant/{merchantId}/assets` → 200
   - `GET /bc/v1/app-services/merchant/{merchantId}/assets` → 200
2. `open-metrics` Click the "YP METRICS" link in the portal navigation (opens the metrics app in a new window) (ok)
   - `GET /saml/activedirectory_ypcanada.php` → 303
   - `POST /simplesaml/module.php/saml/sp/saml2-acs.php/mymetrics_yp_ca_activedirectory_ypcanada` → 303
   - `GET /saml/activedirectory_ypcanada.php` → 302
   - `GET /client/dist/` → 200
   - `GET /server/api/session/initUser` → 200
   - `POST /server/api/log_performance` → 200
   - `GET /server/api/session/initUser` → 200
   - `GET /server/api/dash/pages/isleads/{isleadId}` → 200
   - `GET /server/api/dash/{dashId}` → 200
   - `GET /server/api/dash/dashboardfilters` → 200
   - `GET /server/api/dash/dashboardfilters/view` → 200
   - `GET /server/api/dash/dashboardfilters/{dashboardfilterId}` → 200
   - `GET /server/api/daterange` → 200
   - `GET /server/api/daterange/relativeranges` → 200
   - `GET /server/api/branding/mappings` → 200
   - `GET /server/api/nav/app` → 200
   - `GET /server/api/categories` → 200
   - `GET /server/api/services` → 200
   - `GET /server/api/dash/pages/isleads/{isleadId}` → 200
   - `GET /server/api/dash/{dashId}` → 200
   - `GET /server/api/dash/pages/isleads/{isleadId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/dash/dashboardfilters/{dashboardfilterId}` → 200
   - `GET /server/api/dash/dashboardfilters/{dashboardfilterId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
3. `open-dashboards` In the metrics app open "Dashboards" (ok)
   - `GET /server/api/dashfolders/isfoldersavailable` → 200
   - `GET /server/api/users/{userId}/listsettings` → 200
   - `GET /server/api/dashfolders` → 200
   - `GET /server/api/dashfolders` → 200
   - `GET /server/api/dash/pages` → 200
   - `GET /server/api/dash/pages` → 200
   - `POST /server/api/dashfiles/listusage` → 200
   - `GET /server/api/dash/pages/{pageId}/thumbnail` → 200
   - `GET /server/api/dash/pages/{pageId}/thumbnail` → 200
4. `open-fav-dashboards-92` In the metrics app open "YP Metrics - English" (ok)
   - `GET /server/api/dash/pages/isleads/{isleadId}` → 200
   - `GET /server/api/dash/{dashId}` → 200
   - `GET /server/api/dash/dashboardfilters` → 200
   - `GET /server/api/dash/dashboardfilters/view` → 200
   - `GET /server/api/dash/dashboardfilters/{dashboardfilterId}` → 200
   - `GET /server/api/categories` → 200
   - `GET /server/api/services` → 200
   - `GET /server/api/dash/pages/isleads/{isleadId}` → 200
   - `GET /server/api/dash/{dashId}` → 200
   - `GET /server/api/dash/pages/isleads/{isleadId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/dash/dashboardfilters/{dashboardfilterId}` → 200
   - `GET /server/api/dash/dashboardfilters/{dashboardfilterId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
5. `open-fav-dashboards-139` In the metrics app open "PJ Métriques - Français" (ok)
   - `GET /server/api/dash/pages/isleads/{isleadId}` → 200
   - `GET /server/api/dash/{dashId}` → 200
   - `GET /server/api/dash/dashboardfilters/{dashboardfilterId}` → 200
   - `GET /server/api/dash/dashboardfilters/{dashboardfilterId}` → 200
   - `GET /server/api/categories` → 200
   - `GET /server/api/dash/pages/isleads/{isleadId}` → 200
   - `GET /server/api/dash/{dashId}` → 200
   - `GET /server/api/dash/pages/isleads/{isleadId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/dash/dashboardfilters/{dashboardfilterId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
6. `open-reportstudio` In the metrics app open "Report Studio" (ok)
   - `GET /server/api/users/{userId}/listsettings` → 200
   - `GET /server/api/reportstudio` → 200
   - `GET /server/api/reportstudio` → 200
   - `POST /server/api/reportstudio/listusage` → 200
7. `open-scheduledreports` In the metrics app open "Report Scheduler" (ok)
   - `GET /server/api/scheduledreports` → 200
   - `GET /server/api/scheduledreports` → 200
8. `open-executivesummaries` In the metrics app open "Executive Summaries" (ok)
   - `GET /server/api/dash/executivesummaries/items` → 200
   - `GET /server/api/dash/executivesummaries/items` → 200
9. `open-reportingtemplates` In the metrics app open "Report Covers" (ok)
   - `GET /server/api/reportingtemplates` → 200
   - `GET /server/api/reportingtemplates` → 200
   - `POST /server/api/reportingtemplates/listusage` → 200
10. `open-leads` In the metrics app open "Leads Dashboard" (ok)
   - `GET /server/api/dash/dashboardfilters` → 200
   - `GET /server/api/dash/dashboardfilters/view` → 200
   - `GET /server/api/dash/leads` → 200
   - `GET /server/api/categories` → 200
   - `GET /server/api/services` → 200
   - `GET /server/api/leads` → 200
   - `GET /server/api/leads` → 200
11. `open-manageleads` In the metrics app open "Manage Leads" (ok)
   - `GET /server/api/admin/manageleads` → 200
   - `GET /server/api/services` → 200
   - `GET /server/api/leads` → 200
12. `open-endcustomers` In the metrics app open "End Customers" (ok)
   - `GET /server/api/endcustomers` → 200
   - `GET /server/api/endcustomers` → 200
13. `open-tags` In the metrics app open "Lead Tags" (ok)
   - `GET /server/api/tags` → 200
   - `GET /server/api/tags` → 200
14. `open-dashboard-english` Open the English dashboard (ok)
   - `GET /server/api/dash/pages/isleads/{isleadId}` → 200
   - `GET /server/api/dash/{dashId}` → 200
   - `GET /server/api/dash/dashboardfilters` → 200
   - `GET /server/api/dash/dashboardfilters/view` → 200
   - `GET /server/api/dash/dashboardfilters/view` → 200
   - `GET /server/api/dash/dashboardfilters/{dashboardfilterId}` → 200
   - `GET /server/api/categories` → 200
   - `GET /server/api/dash/pages/isleads/{isleadId}` → 200
   - `GET /server/api/dash/{dashId}` → 200
   - `GET /server/api/dash/pages/isleads/{isleadId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/dash/dashboardfilters/{dashboardfilterId}` → 200
   - `GET /server/api/dash/dashboardfilters/{dashboardfilterId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
15. `tab-overview` Switch to the "Overview" tab of the dashboard (ok)
   - No network traffic captured for a step that expected it.
16. `tab-yp-network` Switch to the "YP Network" tab of the dashboard (ok)
   - `GET /server/api/dash/{dashId}` → 200
   - `GET /server/api/dash/pages/isleads/{isleadId}` → 200
   - `GET /server/api/dash/{dashId}` → 200
   - `GET /server/api/dash/dashboardfilters/{dashboardfilterId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
17. `tab-website` Switch to the "Website" tab of the dashboard (ok)
   - `GET /server/api/dash/{dashId}` → 200
   - `GET /server/api/dash/pages/isleads/{isleadId}` → 200
   - `GET /server/api/dash/{dashId}` → 200
   - `GET /server/api/dash/dashboardfilters/{dashboardfilterId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
18. `tab-print-advertising` Switch to the "Print Advertising" tab of the dashboard (ok)
   - `GET /server/api/dash/{dashId}` → 200
   - `GET /server/api/dash/pages/isleads/{isleadId}` → 200
   - `GET /server/api/dash/{dashId}` → 200
   - `GET /server/api/dash/dashboardfilters/{dashboardfilterId}` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
19. `tab-sem` Switch to the "SEM" tab of the dashboard (ok)
   - `GET /server/api/dash/{dashId}` → 200
   - `GET /server/api/dash/pages/isleads/{isleadId}` → 200
   - `GET /server/api/dash/{dashId}` → 200
   - `GET /server/api/dash/dashboardfilters/{dashboardfilterId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/device` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/device` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/services/{serviceId}/data/conversion` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/services/{serviceId}/data/adgroup` → 200
   - `GET /server/api/services/{serviceId}/data/city` → 200
   - `GET /server/api/services/{serviceId}/data/keyword` → 200
   - `GET /server/api/services/{serviceId}/data/cgnad` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/services/{serviceId}/data/cgnad` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/services/{serviceId}/data/cgnad` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
20. `tab-facebook-ads-management` Switch to the "Facebook Ads Management" tab of the dashboard (ok)
   - `GET /server/api/dash/{dashId}` → 200
   - `GET /server/api/dash/pages/isleads/{isleadId}` → 200
   - `GET /server/api/dash/{dashId}` → 200
   - `GET /server/api/dash/dashboardfilters/{dashboardfilterId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/services/{serviceId}/data/genderagescgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/genderagescgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/adgroupcgn` → 200
   - `GET /server/api/services/{serviceId}/data/device` → 200
21. `range-30-days` Apply the "30 Days" date range (ok)
   - `POST /server/api/daterange` → 200
   - `GET /server/api/dash/{dashId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/categories` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/genderagescgn` → 200
   - `GET /server/api/services/{serviceId}/data/genderagescgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/adgroupcgn` → 200
   - `GET /server/api/services/{serviceId}/data/device` → 200
22. `range-last-month` Apply the "Last Month" date range (ok)
   - `POST /server/api/daterange` → 200
   - `GET /server/api/dash/{dashId}` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/dash/widgets/{widgetId}/data` → 200
   - `GET /server/api/categories` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/categories/{categoryId}/data/{dataId}` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/genderagescgn` → 200
   - `GET /server/api/services/{serviceId}/data/genderagescgn` → 200
   - `GET /server/api/services/{serviceId}/data/cgn` → 200
   - `GET /server/api/services/{serviceId}/data/adgroupcgn` → 200
   - `GET /server/api/services/{serviceId}/data/device` → 200

### Read-only tour

Open the signed-in start page, every read-only navigation link it shows, and a few of the items on each page.

- Effect: read
- Latest run: `20261104T213945Z-3040`, completed, 2026-11-04T21:40:40.637Z
- Precondition: signed in

1. `open-start` Open https://ypforbusiness.yellowpages.ca/ (ok)
   - `GET /` → 200
   - `GET /bc/v1/app-services/url/analytics/{analyticId}` → 200
   - `GET /bc/v1/app-services/merchant/{merchantId}/assets` → 200
   - `GET /bc/v1/app-services/merchant/{merchantId}/assets` → 200
   - `GET /bc/v1/app-services/account/{accountId}/bank-hours` → 200
   - `GET /bc/v1/app-services/merchant/{merchantId}/assets` → 200
   - `GET /bc/v1/app-services/merchant/{merchantId}/assets` → 200
2. `open-2` Open VISIBILITY AND REPUTATION (ok)
   - `GET /reviews/overview` → 200
3. `open-3` Open DASHBOARD (ok)
   - `GET /dashboard` → 200
   - `GET /bc/v1/app-services/url/analytics/{analyticId}` → 200
   - `GET /bc/v1/app-services/merchant/{merchantId}/assets` → 200
   - `GET /bc/v1/app-services/merchant/{merchantId}/assets` → 200
   - `GET /bc/v1/app-services/account/{accountId}/bank-hours` → 200
   - `GET /bc/v1/app-services/merchant/{merchantId}/assets` → 200
   - `GET /bc/v1/app-services/merchant/{merchantId}/assets` → 200
4. `open-4` Open CONTENT (ok)
   - `GET /content-manager` → 200
5. `open-5` Open WEBSITE MANAGER (ok)
   - `GET /content-manager/website-manager/overview` → 200
6. `open-6` Open YP.CA REVIEWS (ok)
   - `GET /reviews-ratings-tabs` → 200
7. `open-7` Open SETTINGS (ok)
   - `GET /settings` → 200
   - `GET /bc/v1/app-services/url/analytics/{analyticId}` → 200
8. `open-8` Open Manage my online visibility (ok)
   - `GET /reviews` → 200
9. `open-9` Open Manage my Website (ok)
   - `GET /content-manager/website-manager` → 200
10. `open-10` Open Manage my logo (ok)
   - `GET /content-manager/media` → 200
11. `open-11` Open YP METRICS (ok)
   - `GET /analytics` → 200
   - `GET /overview` → ?
   - `GET /bc/v1/app-services/url/analytics/{analyticId}` → 200
   - `GET /bc/v1/app-services/merchant/{merchantId}/assets` → 200
   - `GET /bc/v1/app-services/merchant/{merchantId}/assets` → 200
   - `GET /bc/v1/app-services/account/{accountId}/bank-hours` → 200
   - `GET /bc/v1/app-services/account/{accountId}/bank-hours` → 200
12. `open-12` Open Personal Settings (ok)
   - `GET /settings/personal` → 200
   - `GET /bc/v1/app-services/url/analytics/{analyticId}` → 200
13. `open-13` Open User Access Management (ok)
   - `GET /settings/user` → 200
   - `GET /bc/v1/app-services/url/analytics/{analyticId}` → 200

## 45 endpoints

### `GET /server/api/admin/manageleads`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `all` | query | literal | `true` | unknown |
| `query_id` | query | computed | `cb7392dd-09c9-498a-8fe4-22ac961541f6` | unknown |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "properties": {
        "page": {
          "properties": {
            "display_order": {
              "type": "integer"
            },
            "entity": {
              "type": "string"
            },
            "icon": {
              "type": "string"
            },
            "icon_bg_color": {
              "type": "string"
            },
            "id": {
              "type": "integer"
            },
            "is_dynamic": {
              "type": "boolean"
            },
            "is_in_library": {
              "type": "boolean"
            },
            "is_predefined": {
              "type": "boolean"
            },
            "is_template": {
              "type": "boolean"
            },
            "layouts": {
              "properties": {
                "1": {
                  "properties": {
                    "display_order": {
                      "type": "integer"
                    },
                    "id": {
                      "type": "integer"
                    },
                    "is_predefined": {
                      "type": "boolean"
                    },
                    "metadata": {
                      "properties": {
                        "custom_icon": {
                          "type": "null"
                        },
                        "custom_icon_color": {
                          "type": "null"
                        },
                        "description": {
                          "type": "null"
                        },
                        "draw_options": {
                          "properties": {
                            "show_background": {
                              "properties": {
                                "metadata": {
                                  "type": "object"
                                },
                                "overridden": {
                                  "type": "boolean"
                                },
                                "value": {
                                  "type": "boolean"
                                }
                              },
                              "required": [
                                "value",
                                "overridden",
                                "metadata"
                              ],
                              "type": "object"
                            },
                            "show_borders": {
                              "properties": {
                                "metadata": {
                                  "type": "object"
                                },
                                "overridden": {
                                  "type": "boolean"
                                },
                                "value": {
                                  "type": "boolean"
                                }
                              },
                              "required": [
                                "value",
                                "overridden",
                                "metadata"
                              ],
                              "type": "object"
                            },
                            "show_data_source": {
                              "properties": {
                                "metadata": {
                                  "type": "object"
                                },
                                "overridden": {
                                  "type": "boolean"
                                },
                                "value": {
                                  "type": "boolean"
                                }
                              },
                              "required": [
                                "value",
                                "overridden",
                                "metadata"
                              ],
                              "type": "object"
                            },
                            "show_header": {
                              "properties": {
                                "metadata": {
                                  "type": "object"
                                },
                                "overridden": {
                                  "type": "boolean"
                                },
                                "value": {
                                  "type": "boolean"
                                }
                              },
                              "required": [
                                "value",
                                "overridden",
                                "metadata"
                              ],
                              "type": "object"
                            },
                            "show_metric_name": {
                              "properties": {
                                "metadata": {
                                  "type": "object"
                                },
                                "overridden": {
                                  "type": "boolean"
                                },
                                "value": {
                                  "type": "boolean"
                                }
                              },
                              "required": [
                                "value",
                                "overridden",
                                "metadata"
                              ],
                              "type": "object"
                            },
                            "show_on_demand_badge": {
                              "properties": {
                                "metadata": {
                                  "type": "object"
                                },
                                "overridden": {
                                  "type": "boolean"
                                },
                                "value": {
                                  "type": "boolean"
                                }
                              },
                              "required": [
                                "value",
                                "overridden",
                                "metadata"
                              ],
                              "type": "object"
                            },
                            "show_shadow": {
                              "properties": {
                                "metadata": {
                                  "type": "object"
                                },
                                "overridden": {
                                  "type": "boolean"
                                },
                                "value": {
                                  "type": "boolean"
                                }
                              },
                              "required": [
                                "value",
                                "overridden",
                                "metadata"
                              ],
                              "type": "object"
                            },
                            "show_title": {
                              "properties": {
                                "metadata": {
                                  "type": "object"
                                },
                                "overridden": {
                                  "type": "boolean"
                                },
                                "value": {
                                  "type": "boolean"
                                }
                              },
                              "required": [
                                "value",
                                "overridden",
                                "metadata"
                              ],
                              "type": "object"
                            },
                            "show_widgets_with_no_data": {
                              "properties": {
                                "metadata": {
                                  "type": "object"
                                },
                                "overridden": {
                                  "type": "boolean"
                                },
                                "value": {
                                  "type": "boolean"
                                }
                              },
                              "required": [
                                "value",
                                "overridden",
                                "metadata"
                              ],
                              "type": "object"
                            }
                          },
                          "required": [
                            "show_background",
                            "show_borders",
                            "show_shadow",
                            "show_header",
                            "show_title",
                            "show_data_source",
                            "show_on_demand_badge",
                            "show_metric_name",
                            "show_widgets_with_no_data"
                          ],
                          "type": "object"
                        },
                        "export_options": {
                          "properties": {
                            "draw_options": {
                              "properties": {
                                "show_borders": {
                                  "type": "object"
                                },
                                "show_data_source": {
                                  "type": "object"
                                },
                                "show_header": {
                                  "type": "object"
                                },
                                "show_metric_name": {
                                  "type": "object"
                                },
                                "show_on_demand_badge": {
                                  "type": "object"
                                },
                                "show_page_footer": {
                                  "type": "boolean"
                                },
                                "show_page_header": {
                                  "type": "boolean"
                                },
                                "show_title": {
                                  "type": "object"
                                }
                              },
                              "required": [
                                "show_borders",
                                "show_header",
                                "show_title",
                                "show_data_source",
                                "show_on_demand_badge",
                                "show_metric_name",
                                "show_page_header",
                                "show_page_footer"
                              ],
                              "type": "object"
                            },
                            "orientation": {
                              "type": "string"
                            }
                          },
                          "required": [
                            "orientation",
                            "draw_options"
                          ],
                          "type": "object"
                        },
                        "icon_mode": {
                          "type": "string"
                        },
                        "is_packed": {
                          "type": "boolean"
                        },
                        "selected_entity": {
                          "type": "null"
                        },
                        "tags": {
                          "type": "array"
                        },
                        "thumbnail_metadata": {
                          "type": "null"
                        }
                      },
                      "required": [
                        "selected_entity",
                        "tags",
                        "description",
                        "is_packed",
                        "draw_options",
                        "thumbnail_metadata",
                        "icon_mode",
                        "custom_icon",
                        "custom_icon_color",
                        "export_options"
                      ],
                      "type": "object"
                    },
                    "page_id": {
                      "type": "integer"
                    },
                    "title": {
                      "type": "string"
                    },
                    "widgets": {
                      "properties": {
                        "1": {
                          "properties": {
                            "display_order": {
                              "type": "integer"
                            },
                            "height": {
                              "type": "integer"
                            },
                            "id": {
                              "type": "integer"
                            },
                            "is_predefined": {
                              "type": "boolean"
                            },
                            "layout_id": {
                              "type": "integer"
                            },
                            "metadata": {
                              "properties": {
                                "compare_to_prior_period": {
                                  "type": "boolean"
                                },
                                "comparison_end_date_override": {
                                  "type": "null"
                                },
                                "comparison_option": {
                                  "type": "string"
                                },
                                "comparison_overwrite": {
                                  "type": "array"
                                },
                                "comparison_relative_date_range": {
                                  "type": "string"
                                },
                                "comparison_start_date_override": {
                                  "type": "null"
                                },
                                "comparison_type": {
                                  "type": "string"
                                },
                                "data_columns": {
                                  "type": "object"
                                },
                                "data_source": {
                                  "type": "object"
                                },
                                "description": {
                                  "type": "null"
                                },
                                "draw_options": {
                                  "type": "object"
                                },
                                "dynamic": {
                                  "type": "object"
                                },
                                "end_date_override": {
                                  "type": "null"
                                },
                                "export_options": {
                                  "type": "null"
                                },
                                "filter_set_id": {
                                  "type": "null"
                                },
                                "ignore_date_range": {
                                  "type": "boolean"
                                },
                                "is_overriding_date_range": {
                                  "type": "boolean"
                                },
                                "load_all_data": {
                                  "type": "boolean"
                                },
                                "product_widget_can_be_accessed": {
                                  "type": "boolean"
                                },
                                "relative_date_range": {
                                  "type": "string"
                                },
                                "sort_by": {
                                  "type": "array"
                                },
                                "sort_order": {
                                  "type": "array"
                                },
                                "start_date_override": {
                                  "type": "null"
                                },
                                "tags": {
                                  "type": "array"
                                },
                                "thumbnail_metadata": {
                                  "type": "null"
                                },
                                "time_grouping": {
                                  "type": "null"
                                },
                                "user_grouped_columns": {
                                  "type": "array"
                                },
                                "weekly_start_day": {
                                  "type": "string"
                                },
                                "widget_products": {
                                  "type": "array"
                                }
                              },
                              "required": [
                                "tags",
                                "description",
                                "export_options",
                                "thumbnail_metadata",
                                "time_grouping",
                                "weekly_start_day",
                                "comparison_option",
                                "filter_set_id",
                                "is_overriding_date_range",
                                "start_date_override",
                                "end_date_override",
                                "relative_date_range",
                                "compare_to_prior_period",
                                "comparison_type",
                                "comparison_start_date_override",
                                "comparison_end_date_override",
                                "comparison_relative_date_range",
                                "ignore_date_range",
                                "widget_products",
                                "product_widget_can_be_accessed",
                                "sort_order",
                                "sort_by",
                                "load_all_data",
                                "comparison_overwrite",
                                "user_grouped_columns",
                                "data_columns",
                                "data_source",
                                "dynamic",
                                "draw_options"
                              ],
                              "type": "object"
                            },
                            "type": {
                              "type": "string"
                            },
                            "width": {
                              "type": "integer"
                            }
                          },
                          "required": [
                            "id",
                            "layout_id",
                            "display_order",
                            "is_predefined",
                            "type",
                            "metadata",
                            "width",
                            "height"
                          ],
                          "type": "object"
                        }
                      },
                      "required": [
                        "1"
                      ],
                      "type": "object"
                    }
                  },
                  "required": [
                    "id",
                    "page_id",
                    "is_predefined",
                    "display_order",
                    "title",
                    "metadata",
                    "widgets"
                  ],
                  "type": "object"
                }
              },
              "required": [
                "1"
              ],
              "type": "object"
            },
            "metadata": {
              "properties": {
                "append_exported_datagrids": {
                  "type": "boolean"
                },
                "append_exported_datagrids_to_layout": {
                  "type": "boolean"
                },
                "chart_palette": {
                  "items": {
                    "type": "string"
                  },
                  "type": "array"
                },
                "client_naics_code": {
                  "type": "null"
                },
                "client_naics_title": {
                  "type": "null"
                },
                "created_from": {
                  "type": "string"
                },
                "dashboard_filters": {
                  "type": "null"
                },
                "description": {
                  "type": "null"
                },
                "disable_comparison": {
                  "type": "boolean"
                },
                "disable_dash_filters": {
                  "type": "boolean"
                },
                "font_size": {
                  "type": "string"
                },
                "hide_empty_exported_widgets": {
                  "type": "boolean"
                },
                "include_summary_page": {
                  "type": "boolean"
                },
                "selected_entity": {
                  "type": "null"
                },
                "tags": {
                  "type": "array"
                }
              },
              "required": [
                "font_size",
                "chart_palette",
                "append_exported_datagrids",
                "append_exported_datagrids_to_layout",
                "hide_empty_exported_widgets",
                "include_summary_page",
                "selected_entity",
                "tags",
                "description",
                "dashboard_filters",
                "disable_dash_filters",
                "disable_comparison",
                "created_from",
                "client_naics_code",
                "client_naics_title"
              ],
              "type": "object"
            },
            "module": {
              "type": "null"
            },
            "title": {
              "type": "string"
            },
            "type": {
              "type": "string"
            }
          },
          "required": [
            "id",
            "is_predefined",
            "display_order",
            "title",
            "module",
            "entity",
            "type",
            "icon",
            "icon_bg_color",
            "metadata",
            "is_dynamic",
            "is_template",
            "is_in_library",
            "layouts"
          ],
          "type": "object"
        }
      },
      "required": [
        "page"
      ],
      "type": "object"
    },
    "error": {
      "type": "boolean"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": {
    "page": {
      "display_order": 1,
      "entity": "manageleads",
      "icon": "icomoon-share",
      "icon_bg_color": "transparent",
      "id": 1,
      "is_dynamic": true,
      "is_in_library": false,
      "is_predefined": true,
      "is_template": false,
      "layouts": {
        "1": {
          "display_order": 1,
          "id": 1,
          "is_predefined": true,
          "metadata": {
            "custom_icon": null,
            "custom_icon_color": null,
            "description": null,
            "draw_options": {
              "show_background": {
                "metadata": {},
                "overridden": false,
                "value": true
              },
              "show_borders": {
                "metadata": {},
                "overridden": false,
                "value": true
              },
              "show_data_source": {
                "metadata": {},
                "overridden": false,
                "value": false
              },
              "show_header": {
                "metadata": {},
                "overridden": false,
                "value": true
              },
              "show_metric_name": {
                "metadata": {},
                "overridden": false,
                "value": true
              },
              "show_on_demand_badge": {
                "metadata": {},
                "overridden": false,
                "value": true
              },
              "show_shadow": {
                "metadata": {},
                "overridden": false,
                "value": false
              },
              "show_title": {
                "metadata": {},
                "overridden": false,
                "value": true
              },
              "show_widgets_with_no_data": {
                "metadata": {},
                "overridden": false,
                "value": true
              }
            },
            "export_options": {
              "draw_options": {
                "show_borders": {
                  "metadata": {},
                  "overridden": false,
                  "value": true
                },
                "show_data_source": {
                  "metadata": {},
                  "overridden": false,
                  "value": true
                },
                "show_header": {
                  "metadata": {},
                  "overridden": false,
                  "value": true
                },
                "show_metric_name": {
                  "metadata": {},
                  "overridden": false,
                  "value": true
                },
                "show_on_demand_badge": {
                  "metadata": {},
                  "overridden": false,
                  "value": true
                },
                "show_page_footer": false,
                "show_page_header": false,
                "show_title": {
                  "metadata": {},
                  "overridden": false,
                  "value": true
                }
              },
              "orientation": "landscape"
            },
            "icon_mode": "default",
            "is_packed": false,
            "selected_entity": null,
            "tags": [],
            "thumbnail_metadata": null
          },
          "page_id": 1,
          "title": "Section 1",
          "widgets": {
            "1": {
              "display_order": 1,
              "height": 6,
              "id": 1,
              "is_predefined": true,
              "layout_id": 1,
              "metadata": {
                "compare_to_prior_period": false,
                "comparison_end_date_override": null,
                "comparison_option": "month_over_month",
                "comparison_overwrite": [],
                "comparison_relative_date_range": "priorperiod",
                "comparison_start_date_override": null,
                "comparison_type": "prior_date_range",
                "data_columns": {
                  "benchmarks": [],
                  "grouped": [],
                  "instance_benchmarks": [],
                  "selected": [
                    {
                      "aggregate_query": null,
                      "allows_null_value": false,
                      "alternate_field": null,
                      "audit_name_column": null,
                      "cell_class": null,
                      "concat_columns_split": ", ",
                      "custom_distinct_values": null,
                      "custom_sort": null,
                      "data_exporter": true,
                      "date_format": null,
                      "default_sort": null,
                      "dependencies": [],
                      "details_order": 18,
                      "edit_control_type": "link",
                      "edit_detail_group_id": 2,
                      "enable_history": false,
                      "error": false,
                      "extra_parameters": [],
                      "field": "note_count",
                      "field_alias": null,
                      "filter_input_type": null,
                      "force_in_select": false,
                      "foreign_mapping": null,
                      "foreign_mapping_dependencies": [],
                      "format": "link",
                      "groupby_field_format": "link",
                      "groupby_id_field": "note_count",
                      "groupby_name_field": "note_count",
                      "has_set_values": false,
                      "ignore_set_data": false,
                      "is_audit_metadata_column": false,
                      "is_custom_cell_render": false,
                      "is_custom_edit_control": true,
                      "is_exportable": true,
                      "is_extra": false,
                      "is_filterable": false,
                      "is_foreign_audit_enabled": false,
                      "is_foreign_field": false,
                      "is_foreign_key": false,
                      "is_groupable": false,
                      "is_groupby_name_field": false,
                      "is_hidden": false,
                      "is_hidden_in_details": true,
                      "is_metric": false,
                      "is_most_recent_value": false,
                      "is_primary_date_field": false,
                      "is_primary_descriptive_name_field": false,
                      "is_primary_key": false,
                      "is_primary_name_field": false,
                      "is_private": false,
                      "is_pseudo": false,
                      "is_read_only": false,
                      "is_required": false,
                      "is_required_in_datatable": false,
                      "is_secret": false,
                      "is_selectable": true,
                      "is_sortable": true,
                      "is_taggable": false,
                      "is_unique": false,
                      "label": "Notes",
                      "original_date_format": null,
                      "placeholder": null,
                      "possible_discrepancy_warning": null,
                      "postprocess_type": "none",
                      "precision": null,
                      "query": null,
                      "show_on_group_by": false,
                      "sticky": false,
                      "summary_dependencies": [],
                      "summary_order": 1,
                      "tag_default_value": null,
                      "tooltip": null,
                      "use_local_timezone": false,
                      "user_translation_field": false,
                      "value_data_source_type": null,
                      "values": [],
                      "width": null
                    },
                    {
                      "aggregate_query": null,
                      "allows_null_value": false,
                      "alternate_field": null,
                      "audit_name_column": null,
                      "cell_class": null,
                      "concat_columns_split": ", ",
                      "custom_distinct_values": null,
                      "custom_sort": null,
                      "data_exporter": true,
                      "date_format": null,
                      "default_sort": null,
                      "dependencies": [],
                      "details_order": 196,
                      "edit_control_type": "text",
                      "edit_detail_group_id": 3,
                      "enable_history": false,
                      "error": false,
                      "extra_parameters": [],
                      "field": "timestamp",
                      "field_alias": null,
                      "filter_input_type": null,
                      "force_in_select": false,
                      "foreign_mapping": null,
                      "foreign_mapping_dependencies": [],
                      "format": "datetime",
                      "groupby_field_format": "datetime",
                      "groupby_id_field": "timestamp",
                      "groupby_name_field": "timestamp",
                      "has_set_values": false,
                      "ignore_set_data": false,
                      "is_audit_metadata_column": false,
                      "is_custom_cell_render": false,
                      "is_custom_edit_control": false,
                      "is_exportable": true,
                      "is_extra": false,
                      "is_filterable": false,
                      "is_foreign_audit_enabled": false,
                      "is_foreign_field": false,
                      "is_foreign_key": false,
                      "is_groupable": true,
                      "is_groupby_name_field": false,
                      "is_hidden": false,
                      "is_hidden_in_details": false,
                      "is_metric": false,
                      "is_most_recent_value": false,
                      "is_primary_date_field": true,
                      "is_primary_descriptive_name_field": false,
                      "is_primary_key": false,
                      "is_primary_name_field": true,
                      "is_private": false,
                      "is_pseudo": false,
                      "is_read_only": true,
                      "is_required": true,
                      "is_required_in_datatable": false,
                      "is_secret": false,
                      "is_selectable": true,
                      "is_sortable": true,
                      "is_taggable": false,
                      "is_unique": false,
                      "label": "Time Logged",
                      "original_date_format": null,
                      "placeholder": null,
                      "possible_discrepancy_warning": null,
                      "postprocess_type": "datetime",
                      "precision": null,
                      "query": null,
                      "show_on_group_by": false,
                      "sticky": false,
                      "summary_dependencies": [],
                      "summary_order": 2,
                      "tag_default_value": null,
                      "tooltip": null,
                      "use_local_timezone": true,
                      "user_translation_field": false,
                      "value_data_source_type": null,
                      "values": [],
                      "width": null
                    }
                  ]
                },
                "data_source": {
                  "color": "#3498db",
                  "data_view": 0,
                  "data_view_name": null,
                  "has_custom_icon": null,
                  "has_live_integration": false,
                  "icon": "icomoon-share",
                  "id": 0,
                  "id_name": "Leads",
                  "include_data_freshness_date": null,
                  "include_num_entities": null,
                  "is_custom_service": null,
                  "is_of_type_service": false,
                  "name": "Leads",
                  "primary_date_field": "timestamp",
                  "requires_date_range": true,
                  "requires_group_by": false,
                  "type": "leads"
                },
                "description": null,
                "draw_options": {
                  "display_length": 10,
                  "grid_is_responsive": false,
                  "grid_paginate": true,
                  "grid_theme": false,
                  "number_of_page": 3,
                  "repeat_full_layout": false,
                  "rows_per_page": 10,
                  "show_background": {
                    "metadata": {},
                    "overridden": false,
                    "value": true
                  },
                  "show_borders": {
                    "metadata": {},
                    "overridden": true,
                    "value": false
                  },
                  "show_data_source": {
                    "metadata": {},
                    "overridden": false,
                    "value": false
                  },
                  "show_header": {
                    "metadata": {},
                    "overridden": true,
                    "value": false
                  },
                  "show_metric_name": {
                    "metadata": {},
                    "overridden": false,
                    "value": true
                  },
                  "show_on_demand_badge": {
                    "metadata": {},
                    "overridden": false,
                    "value": true
                  },
                  "show_shadow": {
                    "metadata": {},
                    "overridden": false,
                    "value": false
                  },
                  "show_title": {
                    "metadata": {},
                    "overridden": false,
                    "value": false
                  },
                  "show_widgets_with_no_data": {
                    "metadata": {},
                    "overridden": false,
                    "value": true
                  },
                  "split_in_multiple_pages": false,
                  "stylized_excel": true,
                  "wrap_text_name": true
                },
                "dynamic": {
                  "alerts": [],
                  "annotations": [],
                  "errors": [],
                  "filter_set_name": null,
                  "filters": [],
                  "is_inactive": false,
                  "is_item_not_found": false,
                  "predefined_data": null,
                  "predefined_filters": null,
                  "raw_data": null,
                  "warnings": []
                },
                "end_date_override": null,
                "export_options": null,
                "filter_set_id": null,
                "ignore_date_range": false,
                "is_overriding_date_range": false,
                "load_all_data": false,
                "product_widget_can_be_accessed": true,
                "relative_date_range": "default",
                "sort_by": [
                  "timestamp"
                ],
                "sort_order": [
                  "desc"
                ],
                "start_date_override": null,
                "tags": [],
                "thumbnail_metadata": null,
                "time_grouping": null,
                "user_grouped_columns": [],
                "weekly_start_day": "sunday",
                "widget_products": []
              },
              "type": "datagrid",
              "width": 12
            }
          }
        }
      },
      "metadata": {
        "append_exported_datagrids": false,
        "append_exported_datagrids_to_layout": false,
        "chart_palette": [
          "#0665a2",
          "#ffc930"
        ],
        "client_naics_code": null,
        "client_naics_title": null,
        "created_from": "",
        "dashboard_filters": null,
        "description": null,
        "disable_comparison": true,
        "disable_dash_filters": true,
        "font_size": "small",
        "hide_empty_exported_widgets": false,
        "include_summary_page": false,
        "selected_entity": null,
        "tags": []
      },
      "module": null,
      "title": "Leads",
      "type": "admin"
    }
  },
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (11)

- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 1x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 1x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 1x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 1x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 1x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 1x)
- `cookie adminhtml` comes from `storage` `storage cookie[adminhtml]` (seen 1x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 1x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 1x)
- `response.body $.data.page.layouts.1.widgets.1.type` feeds `GET /server/api/leads` `query widget_type`
- `set-cookie adminhtml` feeds `GET /server/api/services` `cookie adminhtml`

**Observed in** (1)

- YP Metrics tour, step `open-manageleads`, run `20261104T214824Z-f674`, 2026-11-04T21:52:00.231Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.967:0`

### `GET /server/api/branding/mappings`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "properties": {
        "agent": {
          "type": "string"
        },
        "agent_client_group": {
          "type": "string"
        },
        "campaign": {
          "type": "string"
        },
        "client": {
          "type": "string"
        },
        "client_group": {
          "type": "string"
        },
        "client_group_plural": {
          "type": "string"
        },
        "client_plural": {
          "type": "string"
        },
        "client_type": {
          "type": "string"
        },
        "cluster": {
          "type": "string"
        },
        "cluster_group": {
          "type": "string"
        },
        "group_of_clients": {
          "type": "string"
        },
        "groups_of_clients": {
          "type": "string"
        },
        "marginrule": {
          "type": "string"
        },
        "smart_campaign": {
          "type": "string"
        }
      },
      "required": [
        "client",
        "client_group",
        "agent_client_group",
        "campaign",
        "agent",
        "client_type",
        "cluster",
        "cluster_group",
        "client_plural",
        "client_group_plural",
        "group_of_clients",
        "groups_of_clients",
        "marginrule",
        "smart_campaign"
      ],
      "type": "object"
    },
    "error": {
      "type": "boolean"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": {
    "agent": "Agent",
    "agent_client_group": "Agent Client Group",
    "campaign": "Campaign",
    "client": "Client",
    "client_group": "Client Group",
    "client_group_plural": "Client Groups",
    "client_plural": "Clients",
    "client_type": "Client",
    "cluster": "Business Unit",
    "cluster_group": "Group of Business Units",
    "group_of_clients": "Group of Clients",
    "groups_of_clients": "Groups of Clients",
    "marginrule": "Margin Rule",
    "smart_campaign": "Smart Campaign"
  },
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (8)

- `cookie ajs_user_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.userEmail` (seen 1x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 1x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 1x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 1x)
- `cookie ajs_group_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.instanceURL` (seen 1x)
- `cookie SimpleSAMLAuthToken` comes from `POST /simplesaml/module.php/saml/sp/saml2-acs.php/mymetrics_yp_ca_activedirectory_ypcanada` `set-cookie SimpleSAMLAuthToken` (seen 1x)
- `cookie adminhtml` comes from `GET /server/api/daterange/relativeranges` `set-cookie adminhtml` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/nav/app` `cookie adminhtml`

**Observed in** (1)

- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:35.043Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.781:0`

### `GET /server/api/categories`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `all` | query | literal | `true` | yes |
| `query_id` | query | computed | `297e580a-7f30-4588-8e18-4d9ca1a2e7da` | yes |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "items": {
        "properties": {
          "boundaries": {
            "type": [
              "array",
              "null"
            ]
          },
          "can_be_accessed": {
            "type": "boolean"
          },
          "can_be_copied": {
            "type": "boolean"
          },
          "can_be_deleted": {
            "type": "boolean"
          },
          "can_be_deleted_tooltip": {
            "type": "null"
          },
          "can_be_edited": {
            "type": "boolean"
          },
          "category_key": {
            "type": [
              "string",
              "null"
            ]
          },
          "color": {
            "type": "string"
          },
          "custom_icon": {
            "type": [
              "string",
              "null"
            ]
          },
          "id": {
            "type": "string"
          },
          "is_ai_managed": {
            "type": "boolean"
          },
          "is_connected": {
            "type": "boolean"
          },
          "is_predefined": {
            "type": "boolean"
          },
          "live_assignments_threshold": {
            "type": "integer"
          },
          "name": {
            "type": "string"
          },
          "service_ids": {
            "additionalProperties": {
              "properties": {
                "active": {
                  "type": "boolean"
                },
                "color": {
                  "type": "string"
                },
                "custom_color": {
                  "type": [
                    "string",
                    "null"
                  ]
                },
                "icon": {
                  "type": "string"
                },
                "id": {
                  "type": "string"
                },
                "is_connected": {
                  "type": "boolean"
                },
                "is_live": {
                  "type": "boolean"
                },
                "is_stored": {
                  "type": "boolean"
                },
                "name": {
                  "type": "string"
                }
              },
              "required": [
                "id",
                "icon",
                "name",
                "color",
                "custom_color",
                "active",
                "is_connected"
              ],
              "type": "object"
            },
            "type": "object"
          },
          "unique_id": {
            "type": [
              "string",
              "null"
            ]
          },
          "warehouse_mappings": {
            "additionalProperties": {
              "type": "string"
            },
            "type": [
              "object",
              "null"
            ]
          }
        },
        "required": [
          "id",
          "unique_id",
          "name",
          "service_ids",
          "color",
          "is_predefined",
          "is_ai_managed",
          "custom_icon",
          "category_key",
          "boundaries",
          "warehouse_mappings",
          "is_connected",
          "live_assignments_threshold",
          "can_be_accessed",
          "can_be_edited",
          "can_be_deleted",
          "can_be_copied",
          "can_be_deleted_tooltip"
        ],
        "type": "object"
      },
      "type": "array"
    },
    "error": {
      "type": "boolean"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": [
    {
      "boundaries": null,
      "can_be_accessed": true,
      "can_be_copied": false,
      "can_be_deleted": false,
      "can_be_deleted_tooltip": null,
      "can_be_edited": false,
      "category_key": "{redacted}",
      "color": "#43ae28",
      "custom_icon": null,
      "id": "43",
      "is_ai_managed": false,
      "is_connected": true,
      "is_predefined": true,
      "live_assignments_threshold": 0,
      "name": "SEO",
      "service_ids": {
        "46": {
          "active": true,
          "color": "#4db4e4",
          "custom_color": null,
          "icon": "seomoz",
          "id": "46",
          "is_connected": false,
          "name": "Moz"
        },
        "63": {
          "active": true,
          "color": "#547CB9",
          "custom_color": null,
          "icon": "googlewebmastertools",
          "id": "63",
          "is_connected": true,
          "name": "Google Search Console"
        },
        "109": {
          "active": true,
          "color": "#015192",
          "custom_color": null,
          "icon": "boostability",
          "id": "109",
          "is_connected": false,
          "name": "Boostability"
        }
      },
      "unique_id": "{redacted}",
      "warehouse_mappings": null
    },
    {
      "boundaries": null,
      "can_be_accessed": true,
      "can_be_copied": false,
      "can_be_deleted": false,
      "can_be_deleted_tooltip": null,
      "can_be_edited": false,
      "category_key": "{redacted}",
      "color": "#3d75d3",
      "custom_icon": null,
      "id": "45",
      "is_ai_managed": false,
      "is_connected": true,
      "is_predefined": true,
      "live_assignments_threshold": 0,
      "name": "SEM/PPC Services",
      "service_ids": {
        "34": {
          "active": true,
          "color": "#497f4c",
          "custom_color": null,
          "icon": "custom-icon icon-fire",
          "id": "34",
          "is_connected": true,
          "name": "Google Ads"
        },
        "36": {
          "active": true,
          "color": "#286942",
          "custom_color": null,
          "icon": "bing",
          "id": "36",
          "is_connected": false,
          "name": "Microsoft Advertising"
        }
      },
      "unique_id": "{redacted}",
      "warehouse_mappings": null
    }
  ],
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (18)

- `cookie ajs_user_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.userEmail` (seen 1x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 7x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 7x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 7x)
- `cookie ajs_group_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.instanceURL` (seen 1x)
- `cookie SimpleSAMLAuthToken` comes from `POST /simplesaml/module.php/saml/sp/saml2-acs.php/mymetrics_yp_ca_activedirectory_ypcanada` `set-cookie SimpleSAMLAuthToken` (seen 1x)
- `cookie adminhtml` comes from `GET /server/api/nav/app` `set-cookie adminhtml` (seen 1x)
- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 6x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 6x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 6x)
- `cookie adminhtml` comes from `GET /server/api/dash/dashboardfilters/{dashboardfilterId}` `set-cookie adminhtml` (seen 3x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 6x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 6x)
- `cookie adminhtml` comes from `GET /server/api/dash/leads` `set-cookie adminhtml` (seen 1x)
- `cookie adminhtml` comes from `GET /server/api/dash/widgets/{widgetId}/data` `set-cookie adminhtml` (seen 2x)
- `set-cookie adminhtml` feeds `GET /server/api/categories/{categoryId}/data/{dataId}` `cookie adminhtml`
- `set-cookie adminhtml` feeds `GET /server/api/dash/pages/isleads/{isleadId}` `cookie adminhtml`
- `set-cookie adminhtml` feeds `GET /server/api/services` `cookie adminhtml`

**Observed in** (7)

- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:35.304Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.788:0`
- YP Metrics tour, step `open-fav-dashboards-92`, run `20261104T214824Z-f674`, 2026-11-04T21:49:30.152Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.851:0`
- YP Metrics tour, step `open-fav-dashboards-139`, run `20261104T214824Z-f674`, 2026-11-04T21:49:51.719Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.883:0`
- YP Metrics tour, step `open-leads`, run `20261104T214824Z-f674`, 2026-11-04T21:51:38.992Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.954:0`
- YP Metrics tour, step `open-dashboard-english`, run `20261104T214824Z-f674`, 2026-11-04T21:53:05.841Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1003:0`
- YP Metrics tour, step `range-30-days`, run `20261104T214824Z-f674`, 2026-11-04T21:55:37.688Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1201:0`
- YP Metrics tour, step `range-last-month`, run `20261104T214824Z-f674`, 2026-11-04T21:55:59.130Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1219:0`

### `GET /server/api/categories/{categoryId}/data/{dataId}`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `categoryId` | path | literal | `83` | yes |
| `dataId` | path | literal | `78` | yes |
| `aggregate` | query | literal | `true` | yes |
| `query_id` | query | computed | `1f3d6679-0b9b-4d01-8655-8c8fce11512e` | yes |
| `daterange` | query | literal | `2026-10-28\|2026-11-03` | yes |
| `fields` | query | binding | `category_metric_539,category_metric_540,category_metric_541,category_metric_543,category_metric_542` | yes |
| `widget_request` | query | binding | `10561` | yes |
| `widget_type` | query | binding | `funnelchart` | yes |
| `widget_page_id` | query | literal | `92` | yes |
| `filter_set_id` | query | binding | `771` | no |
| `groupby` | query | binding | `category_metric_555` | no |
| `sort` | query | binding | `log_date` | no |
| `timegrouping` | query | binding | `dynamic` | no |
| `show_empty_dates` | query | literal | `true` | no |
| `datatable` | query | literal | `true` | no |
| `page` | query | literal | `0,10` | no |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "anyOf": [
        {
          "items": {
            "properties": {
              "_service_id": {
                "type": "string"
              },
              "calculation_148": {
                "type": "string"
              },
              "calculation_153": {
                "type": "string"
              },
              "calculation_183": {
                "type": "string"
              },
              "calculation_193": {
                "type": "string"
              },
              "calculation_284": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "calculation_285": {
                "type": "null"
              },
              "calculation_318": {
                "type": "string"
              },
              "category_metric_1033": {
                "type": "string"
              },
              "category_metric_430": {
                "type": "string"
              },
              "category_metric_431": {
                "type": "string"
              },
              "category_metric_505": {
                "type": "string"
              },
              "category_metric_506": {
                "type": "string"
              },
              "category_metric_516": {
                "type": "string"
              },
              "category_metric_539": {
                "type": "string"
              },
              "category_metric_540": {
                "type": "string"
              },
              "category_metric_541": {
                "type": "string"
              },
              "category_metric_542": {
                "type": "string"
              },
              "category_metric_543": {
                "type": "string"
              },
              "category_metric_544": {
                "type": "string"
              },
              "category_metric_545": {
                "type": "string"
              },
              "category_metric_546": {
                "type": "string"
              },
              "category_metric_549": {
                "type": "string"
              },
              "category_metric_555": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "category_metric_556": {
                "type": "string"
              },
              "category_metric_641": {
                "type": "null"
              },
              "category_metric_643": {
                "type": "string"
              },
              "category_metric_644": {
                "type": "string"
              },
              "category_metric_647": {
                "type": "string"
              },
              "category_metric_648": {
                "type": "null"
              },
              "category_metric_649": {
                "type": "null"
              },
              "category_metric_730": {
                "type": "string"
              },
              "category_metric_731": {
                "type": "string"
              },
              "category_metric_732": {
                "type": "string"
              },
              "category_metric_733": {
                "type": "string"
              },
              "category_metric_750": {
                "type": "null"
              },
              "category_metric_754": {
                "type": "string"
              },
              "category_metric_756": {
                "type": "string"
              },
              "category_metric_757": {
                "type": "string"
              },
              "category_metric_772": {
                "type": "string"
              },
              "category_metric_773": {
                "type": "string"
              },
              "category_metric_779": {
                "type": "string"
              },
              "category_metric_781": {
                "type": "string"
              },
              "category_metric_782": {
                "type": "string"
              },
              "category_metric_783": {
                "type": "string"
              },
              "category_metric_785": {
                "type": "string"
              },
              "category_metric_794": {
                "type": "string"
              },
              "category_metric_795": {
                "type": "string"
              },
              "category_metric_797": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "category_metric_798": {
                "type": "string"
              },
              "category_metric_799": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "category_metric_800": {
                "type": "string"
              },
              "category_metric_801": {
                "type": "string"
              },
              "category_metric_802": {
                "type": "string"
              },
              "category_metric_805": {
                "type": "string"
              },
              "category_metric_807": {
                "type": "string"
              },
              "category_metric_808": {
                "type": "string"
              },
              "category_metric_809": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "category_metric_810": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "category_metric_835": {
                "type": "string"
              },
              "category_metric_837": {
                "type": "string"
              },
              "category_metric_838": {
                "type": "string"
              },
              "category_metric_956": {
                "type": "string"
              },
              "category_metric_979": {
                "type": "string"
              },
              "category_metric_981": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "category_metric_984": {
                "type": "string"
              },
              "formatted_log_date": {
                "type": "string"
              },
              "log_date": {
                "anyOf": [
                  {
                    "type": "integer"
                  },
                  {
                    "type": "string"
                  }
                ]
              },
              "timegroup": {
                "type": "string"
              }
            },
            "type": "object"
          },
          "type": "array"
        },
        {
          "properties": {
            "aaData": {
              "items": {
                "properties": {
                  "_service_id": {
                    "type": "string"
                  },
                  "category_metric_792": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "category_metric_794": {
                    "type": "string"
                  },
                  "category_metric_795": {
                    "type": "string"
                  },
                  "category_metric_796": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "category_metric_797": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "category_metric_799": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "category_metric_800": {
                    "type": "string"
                  },
                  "category_metric_801": {
                    "type": "string"
                  },
                  "category_metric_805": {
                    "type": "string"
                  },
                  "category_metric_807": {
                    "type": "string"
                  },
                  "category_metric_808": {
                    "type": "string"
                  },
                  "category_metric_809": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "category_metric_810": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "category_metric_836": {
                    "type": "string"
                  },
                  "category_metric_837": {
                    "type": "string"
                  },
                  "category_metric_839": {
                    "type": "string"
                  },
                  "category_metric_840": {
                    "type": "string"
                  },
                  "category_metric_841": {
                    "type": "string"
                  },
                  "category_metric_842": {
                    "type": "string"
                  },
                  "category_metric_843": {
                    "type": "string"
                  },
                  "category_metric_851": {
                    "type": "null"
                  },
                  "category_metric_868": {
                    "type": "string"
                  },
                  "category_metric_869": {
                    "type": "string"
                  },
                  "category_metric_871": {
                    "type": "string"
                  },
                  "category_metric_905": {
                    "type": "string"
                  },
                  "category_metric_906": {
                    "type": "string"
                  },
                  "category_metric_981": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "category_metric_984": {
                    "type": "string"
                  }
                },
                "required": [
                  "_service_id"
                ],
                "type": "object"
              },
              "type": "array"
            },
            "iTotalDisplayRecords": {
              "type": "integer"
            },
            "iTotalRecords": {
              "type": "integer"
            },
            "sEcho": {
              "type": "string"
            }
          },
          "required": [
            "sEcho",
            "iTotalRecords",
            "iTotalDisplayRecords",
            "aaData"
          ],
          "type": "object"
        }
      ]
    },
    "error": {
      "type": "boolean"
    },
    "query_id": {
      "format": "uuid",
      "type": "string"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "query_id",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": [
    {
      "_service_id": "34",
      "category_metric_539": "10950",
      "category_metric_540": "237",
      "category_metric_541": "4",
      "category_metric_542": "9",
      "category_metric_543": "0"
    }
  ],
  "error": false,
  "query_id": "1f3d6679-0b9b-4d01-8655-8c8fce11512e",
  "status": 200,
  "warnings": []
}
```

**Bindings** (136)

- `query widget_request` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[44]` (seen 3x)
- `query widget_type` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.125.widgets.10561.type` (seen 4x)
- `cookie ajs_user_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.userEmail` (seen 5x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 59x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 59x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 59x)
- `cookie ajs_group_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.instanceURL` (seen 5x)
- `cookie SimpleSAMLAuthToken` comes from `POST /simplesaml/module.php/saml/sp/saml2-acs.php/mymetrics_yp_ca_activedirectory_ypcanada` `set-cookie SimpleSAMLAuthToken` (seen 5x)
- `cookie adminhtml` comes from `GET /server/api/services/{serviceId}/data/cgn` `set-cookie adminhtml` (seen 4x)
- `query widget_request` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[216]` (seen 3x)
- `query widget_type` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.125.widgets.82740.type` (seen 22x)
- `cookie adminhtml` comes from `GET /server/api/dash/widgets/{widgetId}/data` `set-cookie adminhtml` (seen 20x)
- `query widget_request` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[215]` (seen 3x)
- `cookie adminhtml` comes from `GET /server/api/dash/dashboardfilters/{dashboardfilterId}` `set-cookie adminhtml` (seen 4x)
- `query fields` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.125.widgets.10568.metadata.data_columns.selected[0].field` (seen 3x)
- `query groupby` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.125.widgets.10568.metadata.data_columns.grouped[0].field` (seen 4x)
- `query widget_request` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[45]` (seen 4x)
- `query widget_type` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.125.widgets.8379.type` (seen 6x)
- `query filter_set_id` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.125.widgets.10570.metadata.filter_set_id` (seen 3x)
- `query sort` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.125.widgets.6793.metadata.data_source.primary_date_field` (seen 11x)
- and 116 more

**Observed in** (59)

- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:35.306Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.796:0`
- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:35.323Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.800:0`
- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:38.299Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.812:0`
- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:38.303Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.814:0`
- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:38.306Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.815:0`
- YP Metrics tour, step `open-fav-dashboards-92`, run `20261104T214824Z-f674`, 2026-11-04T21:49:30.154Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.859:0`
- YP Metrics tour, step `open-fav-dashboards-92`, run `20261104T214824Z-f674`, 2026-11-04T21:49:30.171Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.862:0`
- YP Metrics tour, step `open-fav-dashboards-92`, run `20261104T214824Z-f674`, 2026-11-04T21:49:33.154Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.869:0`
- YP Metrics tour, step `open-fav-dashboards-92`, run `20261104T214824Z-f674`, 2026-11-04T21:49:33.159Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.871:0`
- YP Metrics tour, step `open-fav-dashboards-92`, run `20261104T214824Z-f674`, 2026-11-04T21:49:33.166Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.872:0`
- YP Metrics tour, step `open-fav-dashboards-139`, run `20261104T214824Z-f674`, 2026-11-04T21:49:51.721Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.890:0`
- YP Metrics tour, step `open-fav-dashboards-139`, run `20261104T214824Z-f674`, 2026-11-04T21:49:51.733Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.892:0`
- and 47 more

### `GET /server/api/dash/dashboardfilters`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `query_id` | query | computed | `4fcf6c22-6e43-499d-95ab-8ebf361bcd2b` | yes |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "items": {
        "properties": {
          "client_id": {
            "type": "null"
          },
          "client_id_column_name": {
            "type": "null"
          },
          "data_source": {
            "type": "null"
          },
          "field": {
            "type": "string"
          },
          "format": {
            "type": "string"
          },
          "is_live_integration": {
            "type": "boolean"
          },
          "is_predefined": {
            "type": "boolean"
          },
          "key": {
            "type": "string"
          },
          "label": {
            "type": "string"
          },
          "limit_available_values": {
            "type": "boolean"
          },
          "order": {
            "type": "integer"
          },
          "skip_hidden_filter": {
            "type": "boolean"
          },
          "source_filter_set_id": {
            "type": "null"
          },
          "type": {
            "type": "string"
          },
          "values": {
            "type": "null"
          }
        },
        "required": [
          "key",
          "field",
          "label",
          "order",
          "format",
          "type",
          "is_predefined",
          "data_source",
          "limit_available_values",
          "source_filter_set_id",
          "client_id_column_name",
          "is_live_integration",
          "skip_hidden_filter",
          "values",
          "client_id"
        ],
        "type": "object"
      },
      "type": "array"
    },
    "error": {
      "type": "boolean"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": [
    {
      "client_id": null,
      "client_id_column_name": null,
      "data_source": null,
      "field": "id",
      "format": "id",
      "is_live_integration": false,
      "is_predefined": true,
      "key": "{redacted}",
      "label": "Client",
      "limit_available_values": false,
      "order": 0,
      "skip_hidden_filter": false,
      "source_filter_set_id": null,
      "type": "in",
      "values": null
    },
    {
      "client_id": null,
      "client_id_column_name": null,
      "data_source": null,
      "field": "id",
      "format": "id",
      "is_live_integration": false,
      "is_predefined": true,
      "key": "{redacted}",
      "label": "Client Group",
      "limit_available_values": false,
      "order": 1,
      "skip_hidden_filter": false,
      "source_filter_set_id": null,
      "type": "in",
      "values": null
    }
  ],
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (14)

- `cookie ajs_user_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.userEmail` (seen 1x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 4x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 4x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 4x)
- `cookie ajs_group_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.instanceURL` (seen 1x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 4x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 4x)
- `cookie SimpleSAMLAuthToken` comes from `POST /simplesaml/module.php/saml/sp/saml2-acs.php/mymetrics_yp_ca_activedirectory_ypcanada` `set-cookie SimpleSAMLAuthToken` (seen 1x)
- `cookie adminhtml` comes from `GET /server/api/dash/{dashId}` `set-cookie adminhtml` (seen 3x)
- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 3x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 3x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 3x)
- `cookie adminhtml` comes from `storage` `storage cookie[adminhtml]` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/dash/dashboardfilters/view` `cookie adminhtml`

**Observed in** (4)

- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:33.737Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.714:0`
- YP Metrics tour, step `open-fav-dashboards-92`, run `20261104T214824Z-f674`, 2026-11-04T21:49:29.282Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.844:0`
- YP Metrics tour, step `open-leads`, run `20261104T214824Z-f674`, 2026-11-04T21:51:38.629Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.947:0`
- YP Metrics tour, step `open-dashboard-english`, run `20261104T214824Z-f674`, 2026-11-04T21:53:04.811Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.996:0`

### `GET /server/api/dash/dashboardfilters/view`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `query_id` | query | computed | `2d7db8a9-abbe-4cea-9635-b1ec0ef3bcae` | yes |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "type": "null"
    },
    "error": {
      "type": "boolean"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": null,
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (16)

- `cookie ajs_user_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.userEmail` (seen 1x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 5x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 5x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 5x)
- `cookie ajs_group_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.instanceURL` (seen 1x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 5x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 5x)
- `cookie SimpleSAMLAuthToken` comes from `POST /simplesaml/module.php/saml/sp/saml2-acs.php/mymetrics_yp_ca_activedirectory_ypcanada` `set-cookie SimpleSAMLAuthToken` (seen 1x)
- `cookie adminhtml` comes from `GET /server/api/dash/dashboardfilters` `set-cookie adminhtml` (seen 4x)
- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 4x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 4x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 4x)
- `cookie adminhtml` comes from `GET /server/api/dash/dashboardfilters/view` `set-cookie adminhtml` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/dash/dashboardfilters/view` `cookie adminhtml`
- `set-cookie adminhtml` feeds `GET /server/api/dash/dashboardfilters/{dashboardfilterId}` `cookie adminhtml`
- `set-cookie adminhtml` feeds `GET /server/api/dash/leads` `cookie adminhtml`

**Observed in** (5)

- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:33.737Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.715:0`
- YP Metrics tour, step `open-fav-dashboards-92`, run `20261104T214824Z-f674`, 2026-11-04T21:49:29.282Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.845:0`
- YP Metrics tour, step `open-leads`, run `20261104T214824Z-f674`, 2026-11-04T21:51:38.629Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.948:0`
- YP Metrics tour, step `open-dashboard-english`, run `20261104T214824Z-f674`, 2026-11-04T21:53:04.812Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.997:0`
- YP Metrics tour, step `open-dashboard-english`, run `20261104T214824Z-f674`, 2026-11-04T21:53:04.983Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1000:0`

### `GET /server/api/dash/dashboardfilters/{dashboardfilterId}`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `dashboardfilterId` | path | literal | `92` | yes |
| `query_id` | query | computed | `8db11fea-9b54-4353-9e58-7e8fc5bb6c44` | yes |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "type": "array"
    },
    "error": {
      "type": "boolean"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": [],
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (21)

- `cookie ajs_user_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.userEmail` (seen 3x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 17x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 17x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 17x)
- `cookie ajs_group_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.instanceURL` (seen 3x)
- `cookie SimpleSAMLAuthToken` comes from `POST /simplesaml/module.php/saml/sp/saml2-acs.php/mymetrics_yp_ca_activedirectory_ypcanada` `set-cookie SimpleSAMLAuthToken` (seen 3x)
- `cookie adminhtml` comes from `GET /server/api/dash/dashboardfilters/view` `set-cookie adminhtml` (seen 3x)
- `cookie adminhtml` comes from `GET /server/api/dash/widgets/{widgetId}/data` `set-cookie adminhtml` (seen 4x)
- `cookie adminhtml` comes from `GET /server/api/dash/dashboardfilters/{dashboardfilterId}` `set-cookie adminhtml` (seen 4x)
- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 14x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 14x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 14x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 14x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 14x)
- `cookie adminhtml` comes from `GET /server/api/dash/{dashId}` `set-cookie adminhtml` (seen 6x)
- `set-cookie adminhtml` feeds `GET /server/api/categories` `cookie adminhtml`
- `set-cookie adminhtml` feeds `GET /server/api/categories/{categoryId}/data/{dataId}` `cookie adminhtml`
- `set-cookie adminhtml` feeds `GET /server/api/dash/dashboardfilters/{dashboardfilterId}` `cookie adminhtml`
- `set-cookie adminhtml` feeds `GET /server/api/dash/widgets/{widgetId}/data` `cookie adminhtml`
- `set-cookie adminhtml` feeds `GET /server/api/daterange` `cookie adminhtml`
- and 1 more

**Observed in** (17)

- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:34.404Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.777:0`
- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:35.595Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.804:0`
- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:36.327Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.807:0`
- YP Metrics tour, step `open-fav-dashboards-92`, run `20261104T214824Z-f674`, 2026-11-04T21:49:29.473Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.850:0`
- YP Metrics tour, step `open-fav-dashboards-92`, run `20261104T214824Z-f674`, 2026-11-04T21:49:30.444Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.864:0`
- YP Metrics tour, step `open-fav-dashboards-92`, run `20261104T214824Z-f674`, 2026-11-04T21:49:31.095Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.865:0`
- YP Metrics tour, step `open-fav-dashboards-139`, run `20261104T214824Z-f674`, 2026-11-04T21:49:51.037Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.880:0`
- YP Metrics tour, step `open-fav-dashboards-139`, run `20261104T214824Z-f674`, 2026-11-04T21:49:51.638Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.881:0`
- YP Metrics tour, step `open-fav-dashboards-139`, run `20261104T214824Z-f674`, 2026-11-04T21:49:52.237Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.895:0`
- YP Metrics tour, step `open-dashboard-english`, run `20261104T214824Z-f674`, 2026-11-04T21:53:04.983Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1001:0`
- YP Metrics tour, step `open-dashboard-english`, run `20261104T214824Z-f674`, 2026-11-04T21:53:06.281Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1013:0`
- YP Metrics tour, step `open-dashboard-english`, run `20261104T214824Z-f674`, 2026-11-04T21:53:07.024Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1014:0`
- and 5 more

### `GET /server/api/dash/executivesummaries/items`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `all` | query | literal | `true` | no |
| `list_type` | query | literal | `dashboard` | yes |
| `datatable` | query | literal | `true` | yes |
| `summary` | query | literal | `true` | yes |
| `sort` | query | literal | `-id` | yes |
| `page` | query | literal | `0,50` | yes |
| `query_id` | query | computed | `8c08cd9a-e97a-4230-ad33-cdb88f9eec1d` | yes |
| `metadata` | query | literal | `true` | no |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "anyOf": [
        {
          "properties": {
            "aaData": {
              "type": "array"
            },
            "iTotalDisplayRecords": {
              "type": "integer"
            },
            "iTotalRecords": {
              "type": "integer"
            },
            "sEcho": {
              "type": "string"
            }
          },
          "required": [
            "sEcho",
            "iTotalRecords",
            "iTotalDisplayRecords",
            "aaData"
          ],
          "type": "object"
        },
        {
          "type": "array"
        }
      ]
    },
    "error": {
      "type": "boolean"
    },
    "metadata": {
      "properties": {
        "columns": {
          "items": {
            "properties": {
              "allows_null_value": {
                "type": "boolean"
              },
              "audit_name_column": {
                "type": "null"
              },
              "cell_class": {
                "type": "null"
              },
              "concat_columns_split": {
                "type": "string"
              },
              "custom_sort": {
                "type": "null"
              },
              "data_exporter": {
                "type": "boolean"
              },
              "default_sort": {
                "type": "null"
              },
              "details_order": {
                "type": "integer"
              },
              "edit_detail_group_id": {
                "type": "null"
              },
              "enable_history": {
                "type": "boolean"
              },
              "field": {
                "type": "string"
              },
              "filter_input_type": {
                "type": "null"
              },
              "foreign_mapping": {
                "properties": {
                  "clause_conditions": {
                    "items": {
                      "properties": {
                        "clause_operator": {
                          "type": "string"
                        },
                        "condition_operator": {
                          "type": "string"
                        },
                        "foreign_field": {
                          "type": "string"
                        },
                        "source_field": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "source_field",
                        "foreign_field",
                        "condition_operator",
                        "clause_operator"
                      ],
                      "type": "object"
                    },
                    "type": "array"
                  },
                  "default_null_display_value": {
                    "type": "null"
                  },
                  "foreign_dependencies": {
                    "type": "array"
                  },
                  "foreign_entity_field": {
                    "type": "null"
                  },
                  "foreign_entity_route": {
                    "type": "string"
                  },
                  "foreign_expression_fields": {
                    "type": "array"
                  },
                  "foreign_fields": {
                    "properties": {
                      "is_enabled": {
                        "type": "string"
                      },
                      "layout_id": {
                        "type": "string"
                      },
                      "layout_title": {
                        "type": "string"
                      },
                      "page_id": {
                        "type": "string"
                      },
                      "page_title": {
                        "type": "string"
                      },
                      "report_id": {
                        "type": "string"
                      },
                      "report_page_id": {
                        "type": "string"
                      }
                    },
                    "type": "object"
                  },
                  "foreign_is_service_data_table": {
                    "type": "boolean"
                  },
                  "foreign_table_alias": {
                    "type": "null"
                  },
                  "foreign_table_name": {
                    "type": "string"
                  },
                  "foreign_values_route": {
                    "type": "string"
                  },
                  "has_object_mapping": {
                    "type": "boolean"
                  },
                  "intermediary_mappings": {
                    "items": {
                      "properties": {
                        "clause_conditions": {
                          "items": {
                            "type": "object"
                          },
                          "type": "array"
                        },
                        "default_null_display_value": {
                          "type": "null"
                        },
                        "foreign_dependencies": {
                          "type": "array"
                        },
                        "foreign_entity_field": {
                          "type": "null"
                        },
                        "foreign_entity_route": {
                          "type": "string"
                        },
                        "foreign_expression_fields": {
                          "type": "array"
                        },
                        "foreign_fields": {
                          "type": "array"
                        },
                        "foreign_is_service_data_table": {
                          "type": "boolean"
                        },
                        "foreign_table_alias": {
                          "type": "null"
                        },
                        "foreign_table_name": {
                          "type": "string"
                        },
                        "foreign_values_route": {
                          "type": "string"
                        },
                        "has_object_mapping": {
                          "type": "boolean"
                        },
                        "intermediary_mappings": {
                          "items": {
                            "type": "object"
                          },
                          "type": "array"
                        },
                        "is_expression_mapping": {
                          "type": "boolean"
                        },
                        "is_forceful_mapping": {
                          "type": "null"
                        },
                        "is_intermediary_join": {
                          "type": "boolean"
                        },
                        "join_type": {
                          "type": "string"
                        },
                        "object_mapping_fields": {
                          "type": "null"
                        },
                        "object_mapping_key": {
                          "type": "null"
                        },
                        "param_bindings": {
                          "type": "null"
                        },
                        "query_type": {
                          "type": "null"
                        },
                        "source_join_table_name": {
                          "type": "string"
                        },
                        "sub_query_fields": {
                          "type": "null"
                        }
                      },
                      "required": [
                        "foreign_table_name",
                        "foreign_fields",
                        "foreign_expression_fields",
                        "foreign_table_alias",
                        "foreign_entity_route",
                        "foreign_values_route",
                        "source_join_table_name",
                        "default_null_display_value",
                        "join_type",
                        "clause_conditions",
                        "is_intermediary_join",
                        "is_forceful_mapping",
                        "is_expression_mapping",
                        "has_object_mapping",
                        "intermediary_mappings",
                        "query_type",
                        "object_mapping_key",
                        "object_mapping_fields",
                        "foreign_entity_field",
                        "foreign_is_service_data_table",
                        "param_bindings",
                        "foreign_dependencies",
                        "sub_query_fields"
                      ],
                      "type": "object"
                    },
                    "type": "array"
                  },
                  "is_expression_mapping": {
                    "type": "boolean"
                  },
                  "is_forceful_mapping": {
                    "type": "null"
                  },
                  "is_intermediary_join": {
                    "type": "boolean"
                  },
                  "join_type": {
                    "type": "string"
                  },
                  "object_mapping_fields": {
                    "type": "null"
                  },
                  "object_mapping_key": {
                    "type": "null"
                  },
                  "param_bindings": {
                    "type": "null"
                  },
                  "query_type": {
                    "type": "null"
                  },
                  "source_join_table_name": {
                    "type": "string"
                  },
                  "sub_query_fields": {
                    "type": "null"
                  }
                },
                "required": [
                  "foreign_table_name",
                  "foreign_fields",
                  "foreign_expression_fields",
                  "foreign_table_alias",
                  "foreign_entity_route",
                  "foreign_values_route",
                  "source_join_table_name",
                  "default_null_display_value",
                  "join_type",
                  "clause_conditions",
                  "is_intermediary_join",
                  "is_forceful_mapping",
                  "is_expression_mapping",
                  "has_object_mapping",
                  "intermediary_mappings",
                  "query_type",
                  "object_mapping_key",
                  "object_mapping_fields",
                  "foreign_entity_field",
                  "foreign_is_service_data_table",
                  "param_bindings",
                  "foreign_dependencies",
                  "sub_query_fields"
                ],
                "type": [
                  "object",
                  "null"
                ]
              },
              "foreign_mapping_dependencies": {
                "type": "array"
              },
              "format": {
                "type": "string"
              },
              "has_set_values": {
                "type": "boolean"
              },
              "is_audit_metadata_column": {
                "type": "boolean"
              },
              "is_custom_cell_render": {
                "type": "boolean"
              },
              "is_exportable": {
                "type": "boolean"
              },
              "is_filterable": {
                "type": "boolean"
              },
              "is_foreign_audit_enabled": {
                "type": "boolean"
              },
              "is_foreign_field": {
                "type": "boolean"
              },
              "is_foreign_key": {
                "type": "boolean"
              },
              "is_groupable": {
                "type": "boolean"
              },
              "is_groupby_name_field": {
                "type": "boolean"
              },
              "is_hidden": {
                "type": "boolean"
              },
              "is_metric": {
                "type": "boolean"
              },
              "is_most_recent_value": {
                "type": "boolean"
              },
              "is_primary_key": {
                "type": "boolean"
              },
              "is_primary_name_field": {
                "type": "boolean"
              },
              "is_pseudo": {
                "type": "boolean"
              },
              "is_read_only": {
                "type": "boolean"
              },
              "is_required_in_datatable": {
                "type": "boolean"
              },
              "is_sortable": {
                "type": "boolean"
              },
              "is_taggable": {
                "type": "boolean"
              },
              "label": {
                "type": "string"
              },
              "original_date_format": {
                "type": "null"
              },
              "postprocess_type": {
                "type": "string"
              },
              "precision": {
                "type": "null"
              },
              "sticky": {
                "type": "boolean"
              },
              "summary_dependencies": {
                "type": "array"
              },
              "summary_order": {
                "type": "integer"
              },
              "tooltip": {
                "type": "null"
              },
              "values": {
                "items": {
                  "properties": {
                    "key": {
                      "type": "string"
                    },
                    "value": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "key",
                    "value"
                  ],
                  "type": "object"
                },
                "type": "array"
              },
              "width": {
                "type": "null"
              }
            },
            "required": [
              "field",
              "label",
              "format",
              "values",
              "has_set_values",
              "details_order",
              "summary_order",
              "is_sortable",
              "cell_class",
              "width",
              "custom_sort",
              "default_sort",
              "tooltip",
              "postprocess_type",
              "is_read_only",
              "allows_null_value",
              "is_hidden",
              "is_primary_key",
              "is_primary_name_field",
              "original_date_format",
              "is_foreign_key",
              "is_foreign_field",
              "foreign_mapping",
              "foreign_mapping_dependencies",
              "concat_columns_split",
              "is_pseudo",
              "is_custom_cell_render",
              "is_groupable",
              "is_filterable",
              "sticky",
              "filter_input_type",
              "is_groupby_name_field",
              "is_most_recent_value",
              "is_metric",
              "precision",
              "enable_history",
              "is_taggable",
              "summary_dependencies",
              "edit_detail_group_id",
              "is_exportable",
              "is_required_in_datatable",
              "is_foreign_audit_enabled",
              "audit_name_column",
              "is_audit_metadata_column",
              "data_exporter"
            ],
            "type": "object"
          },
          "type": "array"
        }
      },
      "required": [
        "columns"
      ],
      "type": "object"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": {
    "aaData": [],
    "iTotalDisplayRecords": 0,
    "iTotalRecords": 0,
    "sEcho": "prod"
  },
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (11)

- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 2x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 2x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 2x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 2x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 2x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 2x)
- `cookie adminhtml` comes from `storage` `storage cookie[adminhtml]` (seen 1x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 2x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 2x)
- `cookie adminhtml` comes from `GET /server/api/dash/executivesummaries/items` `set-cookie adminhtml` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/dash/executivesummaries/items` `cookie adminhtml`

**Observed in** (2)

- YP Metrics tour, step `open-executivesummaries`, run `20261104T214824Z-f674`, 2026-11-04T21:50:55.588Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.933:0`
- YP Metrics tour, step `open-executivesummaries`, run `20261104T214824Z-f674`, 2026-11-04T21:50:55.589Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.934:0`

### `GET /server/api/dash/leads`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `all` | query | literal | `true` | unknown |
| `single_layout_widgets_only` | query | literal | `true` | unknown |
| `include_executive_summary` | query | literal | `true` | unknown |
| `query_id` | query | computed | `5de0efdd-3227-4aef-8a25-760ff0625aec` | unknown |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "properties": {
        "page": {
          "properties": {
            "can_be_accessed": {
              "type": "boolean"
            },
            "can_be_copied": {
              "type": "boolean"
            },
            "can_be_deleted": {
              "type": "boolean"
            },
            "can_be_deleted_tooltip": {
              "type": "null"
            },
            "can_be_edited": {
              "type": "boolean"
            },
            "can_be_listed": {
              "type": "boolean"
            },
            "can_favorite": {
              "type": "boolean"
            },
            "cluster": {
              "type": "null"
            },
            "cluster_id": {
              "type": "null"
            },
            "created_at": {
              "type": "integer"
            },
            "data_sources": {
              "items": {
                "properties": {
                  "data_source_id": {
                    "type": "string"
                  },
                  "data_type": {
                    "type": "string"
                  },
                  "data_view_id": {
                    "type": "string"
                  }
                },
                "required": [
                  "data_source_id",
                  "data_type",
                  "data_view_id"
                ],
                "type": "object"
              },
              "type": "array"
            },
            "display_order": {
              "type": "integer"
            },
            "entity": {
              "type": "string"
            },
            "entity_display": {
              "type": "string"
            },
            "executive_summary_enabled": {
              "type": "boolean"
            },
            "folder_id": {
              "type": "null"
            },
            "folder_name": {
              "type": "null"
            },
            "formatted_created_at": {
              "type": "string"
            },
            "formatted_updated_at": {
              "type": "string"
            },
            "global_filter_ids": {
              "type": "array"
            },
            "granular_access_levels": {
              "properties": {
                "can_be_edited": {
                  "type": "boolean"
                }
              },
              "required": [
                "can_be_edited"
              ],
              "type": "object"
            },
            "has_granular_permissions": {
              "type": "boolean"
            },
            "has_widgets_on_first_section": {
              "type": "boolean"
            },
            "icon": {
              "type": "string"
            },
            "icon_bg_color": {
              "type": "string"
            },
            "id": {
              "type": "string"
            },
            "is_dynamic": {
              "type": "boolean"
            },
            "is_favorite": {
              "type": "boolean"
            },
            "is_in_library": {
              "type": "boolean"
            },
            "is_locked": {
              "type": "boolean"
            },
            "is_predefined": {
              "type": "boolean"
            },
            "is_template": {
              "type": "boolean"
            },
            "layouts": {
              "properties": {
                "65": {
                  "properties": {
                    "created_at": {
                      "type": "integer"
                    },
                    "display_order": {
                      "type": "integer"
                    },
                    "formatted_created_at": {
                      "type": "string"
                    },
                    "formatted_updated_at": {
                      "type": "string"
                    },
                    "id": {
                      "type": "string"
                    },
                    "is_in_library": {
                      "type": "boolean"
                    },
                    "is_predefined": {
                      "type": "boolean"
                    },
                    "metadata": {
                      "properties": {
                        "custom_icon": {
                          "type": "null"
                        },
                        "custom_icon_color": {
                          "type": "null"
                        },
                        "description": {
                          "type": "null"
                        },
                        "draw_options": {
                          "properties": {
                            "show_background": {
                              "properties": {
                                "metadata": {
                                  "type": "object"
                                },
                                "overridden": {
                                  "type": "boolean"
                                },
                                "value": {
                                  "type": "boolean"
                                }
                              },
                              "required": [
                                "value",
                                "overridden",
                                "metadata"
                              ],
                              "type": "object"
                            },
                            "show_borders": {
                              "properties": {
                                "metadata": {
                                  "type": "object"
                                },
                                "overridden": {
                                  "type": "boolean"
                                },
                                "value": {
                                  "type": "boolean"
                                }
                              },
                              "required": [
                                "value",
                                "overridden",
                                "metadata"
                              ],
                              "type": "object"
                            },
                            "show_data_source": {
                              "properties": {
                                "metadata": {
                                  "type": "object"
                                },
                                "overridden": {
                                  "type": "boolean"
                                },
                                "value": {
                                  "type": "boolean"
                                }
                              },
                              "required": [
                                "value",
                                "overridden",
                                "metadata"
                              ],
                              "type": "object"
                            },
                            "show_header": {
                              "properties": {
                                "metadata": {
                                  "type": "object"
                                },
                                "overridden": {
                                  "type": "boolean"
                                },
                                "value": {
                                  "type": "boolean"
                                }
                              },
                              "required": [
                                "value",
                                "overridden",
                                "metadata"
                              ],
                              "type": "object"
                            },
                            "show_metric_name": {
                              "properties": {
                                "metadata": {
                                  "type": "object"
                                },
                                "overridden": {
                                  "type": "boolean"
                                },
                                "value": {
                                  "type": "boolean"
                                }
                              },
                              "required": [
                                "value",
                                "overridden",
                                "metadata"
                              ],
                              "type": "object"
                            },
                            "show_on_demand_badge": {
                              "properties": {
                                "metadata": {
                                  "type": "object"
                                },
                                "overridden": {
                                  "type": "boolean"
                                },
                                "value": {
                                  "type": "boolean"
                                }
                              },
                              "required": [
                                "value",
                                "overridden",
                                "metadata"
                              ],
                              "type": "object"
                            },
                            "show_shadow": {
                              "properties": {
                                "metadata": {
                                  "type": "object"
                                },
                                "overridden": {
                                  "type": "boolean"
                                },
                                "value": {
                                  "type": "boolean"
                                }
                              },
                              "required": [
                                "value",
                                "overridden",
                                "metadata"
                              ],
                              "type": "object"
                            },
                            "show_title": {
                              "properties": {
                                "metadata": {
                                  "type": "object"
                                },
                                "overridden": {
                                  "type": "boolean"
                                },
                                "value": {
                                  "type": "boolean"
                                }
                              },
                              "required": [
                                "value",
                                "overridden",
                                "metadata"
                              ],
                              "type": "object"
                            },
                            "show_widgets_with_no_data": {
                              "properties": {
                                "metadata": {
                                  "type": "object"
                                },
                                "overridden": {
                                  "type": "boolean"
                                },
                                "value": {
                                  "type": "boolean"
                                }
                              },
                              "required": [
                                "value",
                                "overridden",
                                "metadata"
                              ],
                              "type": "object"
                            }
                          },
                          "required": [
                            "show_background",
                            "show_borders",
                            "show_shadow",
                            "show_header",
                            "show_title",
                            "show_data_source",
                            "show_widgets_with_no_data",
                            "show_on_demand_badge",
                            "show_metric_name"
                          ],
                          "type": "object"
                        },
                        "export_options": {
                          "properties": {
                            "draw_options": {
                              "properties": {
                                "is_dark_mode": {
                                  "type": "object"
                                },
                                "show_background": {
                                  "type": "object"
                                },
                                "show_borders": {
                                  "type": "object"
                                },
                                "show_data_source": {
                                  "type": "object"
                                },
                                "show_header": {
                                  "type": "object"
                                },
                                "show_page_footer": {
                                  "type": "boolean"
                                },
                                "show_page_header": {
                                  "type": "boolean"
                                },
                                "show_title": {
                                  "type": "object"
                                }
                              },
                              "required": [
                                "show_background",
                                "show_borders",
                                "show_header",
                                "show_title",
                                "show_data_source",
                                "show_page_header",
                                "show_page_footer",
                                "is_dark_mode"
                              ],
                              "type": "object"
                            },
                            "orientation": {
                              "type": "string"
                            }
                          },
                          "required": [
                            "orientation",
                            "draw_options"
                          ],
                          "type": "object"
                        },
                        "icon_mode": {
                          "type": "string"
                        },
                        "is_packed": {
                          "type": "boolean"
                        },
                        "selected_entity": {
                          "type": "null"
                        },
                        "tags": {
                          "type": "array"
                        },
                        "thumbnail_metadata": {
                          "type": "null"
                        }
                      },
                      "required": [
                        "selected_entity",
                        "is_packed",
                        "draw_options",
                        "export_options",
                        "tags",
                        "description",
                        "thumbnail_metadata",
                        "icon_mode",
                        "custom_icon",
                        "custom_icon_color"
                      ],
                      "type": "object"
                    },
                    "page_id": {
                      "type": "string"
                    },
                    "timegroup": {
                      "type": "string"
                    },
                    "title": {
                      "type": "string"
                    },
                    "unique_id": {
                      "type": "null"
                    },
                    "updated_at": {
                      "type": "integer"
                    },
                    "widgets": {
                      "properties": {
                        "5159": {
                          "properties": {
                            "assignments": {
                              "type": "null"
                            },
                            "can_be_accessed": {
                              "type": "boolean"
                            },
                            "can_be_copied": {
                              "type": "boolean"
                            },
                            "can_be_deleted": {
                              "type": "boolean"
                            },
                            "can_be_deleted_tooltip": {
                              "type": "null"
                            },
                            "can_be_edited": {
                              "type": "boolean"
                            },
                            "created_at": {
                              "type": "integer"
                            },
                            "created_from_library": {
                              "type": "boolean"
                            },
                            "data_source_id": {
                              "type": "string"
                            },
                            "data_type": {
                              "type": "string"
                            },
                            "data_view_id": {
                              "type": "string"
                            },
                            "display_order": {
                              "type": "integer"
                            },
                            "formatted_created_at": {
                              "type": "string"
                            },
                            "formatted_updated_at": {
                              "type": "string"
                            },
                            "has_live_integration": {
                              "type": "boolean"
                            },
                            "height": {
                              "type": "integer"
                            },
                            "id": {
                              "type": "string"
                            },
                            "is_in_library": {
                              "type": "boolean"
                            },
                            "is_predefined": {
                              "type": "boolean"
                            },
                            "is_using_calculation": {
                              "type": "boolean"
                            },
                            "layout_id": {
                              "type": "string"
                            },
                            "library_download_count": {
                              "type": "integer"
                            },
                            "metadata": {
                              "properties": {
                                "compare_to_prior_period": {
                                  "type": "boolean"
                                },
                                "comparison_end_date_override": {
                                  "type": "null"
                                },
                                "comparison_option": {
                                  "type": "string"
                                },
                                "comparison_overwrite": {
                                  "type": "array"
                                },
                                "comparison_relative_date_range": {
                                  "type": "string"
                                },
                                "comparison_start_date_override": {
                                  "type": "null"
                                },
                                "comparison_type": {
                                  "type": "string"
                                },
                                "comparison_type_display": {
                                  "type": "string"
                                },
                                "data_columns": {
                                  "type": "object"
                                },
                                "data_source": {
                                  "type": "object"
                                },
                                "description": {
                                  "type": "string"
                                },
                                "draw_options": {
                                  "type": "object"
                                },
                                "dynamic": {
                                  "type": "object"
                                },
                                "end_date_override": {
                                  "type": "null"
                                },
                                "export_options": {
                                  "type": "null"
                                },
                                "filter_set_id": {
                                  "type": "null"
                                },
                                "ignore_date_range": {
                                  "type": "boolean"
                                },
                                "is_overriding_date_range": {
                                  "type": "boolean"
                                },
                                "load_all_data": {
                                  "type": "boolean"
                                },
                                "product_widget_can_be_accessed": {
                                  "type": "boolean"
                                },
                                "relative_date_range": {
                                  "type": "string"
                                },
                                "sort_by": {
                                  "type": "array"
                                },
                                "sort_order": {
                                  "type": "array"
                                },
                                "start_date_override": {
                                  "type": "null"
                                },
                                "tags": {
                                  "type": "array"
                                },
                                "thumbnail_metadata": {
                                  "type": "null"
                                },
                                "time_grouping": {
                                  "type": "null"
                                },
                                "time_grouping_display": {
                                  "type": "null"
                                },
                                "user_grouped_columns": {
                                  "type": "array"
                                },
                                "weekly_start_day": {
                                  "type": "string"
                                },
                                "weekly_start_day_display": {
                                  "type": "string"
                                },
                                "widget_products": {
                                  "type": "array"
                                }
                              },
                              "required": [
                                "draw_options",
                                "data_columns",
                                "description",
                                "export_options",
                                "time_grouping",
                                "filter_set_id",
                                "is_overriding_date_range",
                                "start_date_override",
                                "end_date_override",
                                "relative_date_range",
                                "compare_to_prior_period",
                                "comparison_start_date_override",
                                "comparison_end_date_override",
                                "comparison_relative_date_range",
                                "sort_order",
                                "sort_by",
                                "ignore_date_range",
                                "load_all_data",
                                "dynamic",
                                "tags",
                                "thumbnail_metadata",
                                "weekly_start_day",
                                "comparison_option",
                                "comparison_type",
                                "widget_products",
                                "product_widget_can_be_accessed",
                                "comparison_overwrite",
                                "user_grouped_columns",
                                "data_source",
                                "comparison_type_display",
                                "time_grouping_display",
                                "weekly_start_day_display"
                              ],
                              "type": "object"
                            },
                            "report_id": {
                              "type": "null"
                            },
                            "timegroup": {
                              "type": "string"
                            },
                            "title": {
                              "type": "string"
                            },
                            "type": {
                              "type": "string"
                            },
                            "type_display": {
                              "type": "string"
                            },
                            "unique_id": {
                              "type": "null"
                            },
                            "updated_at": {
                              "type": "integer"
                            },
                            "width": {
                              "type": "integer"
                            }
                          },
                          "required": [
                            "id",
                            "unique_id",
                            "layout_id",
                            "report_id",
                            "type",
                            "width",
                            "height",
                            "display_order",
                            "title",
                            "is_predefined",
                            "is_in_library",
                            "created_from_library",
                            "metadata",
                            "created_at",
                            "updated_at",
                            "library_download_count",
                            "data_type",
                            "data_source_id",
                            "data_view_id",
                            "has_live_integration",
                            "is_using_calculation",
                            "assignments",
                            "type_display",
                            "timegroup",
                            "formatted_updated_at",
                            "formatted_created_at",
                            "can_be_accessed",
                            "can_be_edited",
                            "can_be_deleted",
                            "can_be_copied",
                            "can_be_deleted_tooltip"
                          ],
                          "type": "object"
                        },
                        "5160": {
                          "properties": {
                            "assignments": {
                              "type": "null"
                            },
                            "can_be_accessed": {
                              "type": "boolean"
                            },
                            "can_be_copied": {
                              "type": "boolean"
                            },
                            "can_be_deleted": {
                              "type": "boolean"
                            },
                            "can_be_deleted_tooltip": {
                              "type": "null"
                            },
                            "can_be_edited": {
                              "type": "boolean"
                            },
                            "created_at": {
                              "type": "integer"
                            },
                            "created_from_library": {
                              "type": "boolean"
                            },
                            "data_source_id": {
                              "type": "string"
                            },
                            "data_type": {
                              "type": "string"
                            },
                            "data_view_id": {
                              "type": "string"
                            },
                            "display_order": {
                              "type": "integer"
                            },
                            "formatted_created_at": {
                              "type": "string"
                            },
                            "formatted_updated_at": {
                              "type": "string"
                            },
                            "has_live_integration": {
                              "type": "boolean"
                            },
                            "height": {
                              "type": "integer"
                            },
                            "id": {
                              "type": "string"
                            },
                            "is_in_library": {
                              "type": "boolean"
                            },
                            "is_predefined": {
                              "type": "boolean"
                            },
                            "is_using_calculation": {
                              "type": "boolean"
                            },
                            "layout_id": {
                              "type": "string"
                            },
                            "library_download_count": {
                              "type": "integer"
                            },
                            "metadata": {
                              "properties": {
                                "chart_palette": {
                                  "type": "null"
                                },
                                "compare_to_prior_period": {
                                  "type": "boolean"
                                },
                                "comparison_end_date_override": {
                                  "type": "null"
                                },
                                "comparison_option": {
                                  "type": "string"
                                },
                                "comparison_relative_date_range": {
                                  "type": "string"
                                },
                                "comparison_start_date_override": {
                                  "type": "null"
                                },
                                "comparison_type": {
                                  "type": "string"
                                },
                                "comparison_type_display": {
                                  "type": "string"
                                },
                                "cumulative_columns": {
                                  "type": "array"
                                },
                                "data_columns": {
                                  "type": "object"
                                },
                                "data_source": {
                                  "type": "object"
                                },
                                "description": {
                                  "type": "string"
                                },
                                "draw_options": {
                                  "type": "object"
                                },
                                "dynamic": {
                                  "type": "object"
                                },
                                "end_date_override": {
                                  "type": "null"
                                },
                                "export_options": {
                                  "type": "null"
                                },
                                "filter_set_id": {
                                  "type": "null"
                                },
                                "ignore_date_range": {
                                  "type": "boolean"
                                },
                                "is_multi_grouped": {
                                  "type": "boolean"
                                },
                                "is_overriding_date_range": {
                                  "type": "boolean"
                                },
                                "line_columns": {
                                  "type": "array"
                                },
                                "move_y_axes": {
                                  "type": "object"
                                },
                                "product_widget_can_be_accessed": {
                                  "type": "boolean"
                                },
                                "relative_date_range": {
                                  "type": "string"
                                },
                                "sort_by": {
                                  "type": "array"
                                },
                                "sort_order": {
                                  "type": "array"
                                },
                                "start_date_override": {
                                  "type": "null"
                                },
                                "tags": {
                                  "type": "array"
                                },
                                "thumbnail_metadata": {
                                  "type": "null"
                                },
                                "time_grouping": {
                                  "type": "string"
                                },
                                "time_grouping_display": {
                                  "type": "string"
                                },
                                "weekly_start_day": {
                                  "type": "string"
                                },
                                "weekly_start_day_display": {
                                  "type": "string"
                                },
                                "widget_products": {
                                  "type": "array"
                                }
                              },
                              "required": [
                                "draw_options",
                                "data_columns",
                                "description",
                                "export_options",
                                "time_grouping",
                                "filter_set_id",
                                "is_overriding_date_range",
                                "start_date_override",
                                "end_date_override",
                                "relative_date_range",
                                "compare_to_prior_period",
                                "comparison_start_date_override",
                                "comparison_end_date_override",
                                "comparison_relative_date_range",
                                "chart_palette",
                                "is_multi_grouped",
                                "line_columns",
                                "sort_by",
                                "ignore_date_range",
                                "time_grouping_display",
                                "dynamic",
                                "sort_order",
                                "tags",
                                "thumbnail_metadata",
                                "weekly_start_day",
                                "comparison_option",
                                "comparison_type",
                                "widget_products",
                                "product_widget_can_be_accessed",
                                "cumulative_columns",
                                "move_y_axes",
                                "data_source",
                                "comparison_type_display",
                                "weekly_start_day_display"
                              ],
                              "type": "object"
                            },
                            "report_id": {
                              "type": "null"
                            },
                            "timegroup": {
                              "type": "string"
                            },
                            "title": {
                              "type": "string"
                            },
                            "type": {
                              "type": "string"
                            },
                            "type_display": {
                              "type": "string"
                            },
                            "unique_id": {
                              "type": "null"
                            },
                            "updated_at": {
                              "type": "integer"
                            },
                            "width": {
                              "type": "integer"
                            }
                          },
                          "required": [
                            "id",
                            "unique_id",
                            "layout_id",
                            "report_id",
                            "type",
                            "width",
                            "height",
                            "display_order",
                            "title",
                            "is_predefined",
                            "is_in_library",
                            "created_from_library",
                            "metadata",
                            "created_at",
                            "updated_at",
                            "library_download_count",
                            "data_type",
                            "data_source_id",
                            "data_view_id",
                            "has_live_integration",
                            "is_using_calculation",
                            "assignments",
                            "type_display",
                            "timegroup",
                            "formatted_updated_at",
                            "formatted_created_at",
                            "can_be_accessed",
                            "can_be_edited",
                            "can_be_deleted",
                            "can_be_copied",
                            "can_be_deleted_tooltip"
                          ],
                          "type": "object"
                        }
                      },
                      "required": [
                        "5159",
                        "5160"
                      ],
                      "type": "object"
                    }
                  },
                  "required": [
                    "id",
                    "unique_id",
                    "page_id",
                    "display_order",
                    "is_predefined",
                    "is_in_library",
                    "title",
                    "metadata",
                    "created_at",
                    "updated_at",
                    "timegroup",
                    "formatted_created_at",
                    "formatted_updated_at",
                    "widgets"
                  ],
                  "type": "object"
                }
              },
              "required": [
                "65"
              ],
              "type": "object"
            },
            "metadata": {
              "properties": {
                "append_exported_datagrids": {
                  "type": "boolean"
                },
                "append_exported_datagrids_to_layout": {
                  "type": "boolean"
                },
                "chart_palette": {
                  "items": {
                    "type": "string"
                  },
                  "type": "array"
                },
                "client_naics_code": {
                  "type": "null"
                },
                "client_naics_title": {
                  "type": "null"
                },
                "created_from": {
                  "type": "string"
                },
                "dashboard_filters": {
                  "type": "null"
                },
                "description": {
                  "type": "null"
                },
                "disable_comparison": {
                  "type": "boolean"
                },
                "disable_dash_filters": {
                  "type": "boolean"
                },
                "font_size": {
                  "type": "string"
                },
                "hide_empty_exported_widgets": {
                  "type": "boolean"
                },
                "include_summary_page": {
                  "type": "boolean"
                },
                "selected_entity": {
                  "type": "null"
                },
                "tags": {
                  "type": "array"
                }
              },
              "required": [
                "font_size",
                "chart_palette",
                "append_exported_datagrids",
                "append_exported_datagrids_to_layout",
                "hide_empty_exported_widgets",
                "selected_entity",
                "dashboard_filters",
                "disable_dash_filters",
                "disable_comparison",
                "include_summary_page",
                "tags",
                "description",
                "created_from",
                "client_naics_code",
                "client_naics_title"
              ],
              "type": "object"
            },
            "module": {
              "type": "null"
            },
            "reporting_profiles": {
              "type": "null"
            },
            "timegroup": {
              "type": "string"
            },
            "title": {
              "type": "string"
            },
            "type": {
              "type": "string"
            },
            "type_display": {
              "type": "string"
            },
            "unique_id": {
              "type": "string"
            },
            "updated_at": {
              "type": "integer"
            },
            "widget_data_warehouse_types": {
              "type": "string"
            },
            "widget_data_warehouse_types_display": {
              "type": "string"
            },
            "widget_ids": {
              "items": {
                "type": "string"
              },
              "type": "array"
            }
          },
          "required": [
            "id",
            "unique_id",
            "display_order",
            "title",
            "is_predefined",
            "is_template",
            "is_in_library",
            "type",
            "module",
            "entity",
            "icon",
            "icon_bg_color",
            "metadata",
            "created_at",
            "updated_at",
            "executive_summary_enabled",
            "is_favorite",
            "reporting_profiles",
            "cluster_id",
            "cluster",
            "widget_ids",
            "data_sources",
            "widget_data_warehouse_types",
            "folder_id",
            "folder_name",
            "is_locked",
            "timegroup",
            "formatted_updated_at",
            "global_filter_ids",
            "has_widgets_on_first_section",
            "formatted_created_at",
            "entity_display",
            "type_display",
            "can_favorite",
            "widget_data_warehouse_types_display",
            "is_dynamic",
            "has_granular_permissions",
            "granular_access_levels",
            "can_be_accessed",
            "can_be_edited",
            "can_be_deleted",
            "can_be_copied",
            "can_be_deleted_tooltip",
            "can_be_listed",
            "layouts"
          ],
          "type": "object"
        }
      },
      "required": [
        "page"
      ],
      "type": "object"
    },
    "error": {
      "type": "boolean"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": {
    "page": {
      "can_be_accessed": true,
      "can_be_copied": false,
      "can_be_deleted": false,
      "can_be_deleted_tooltip": null,
      "can_be_edited": false,
      "can_be_listed": true,
      "can_favorite": true,
      "cluster": null,
      "cluster_id": null,
      "created_at": 1532045030,
      "data_sources": [
        {
          "data_source_id": "0",
          "data_type": "leads",
          "data_view_id": "0"
        }
      ],
      "display_order": 999,
      "entity": "leads",
      "entity_display": "Leads Dashboard",
      "executive_summary_enabled": false,
      "folder_id": null,
      "folder_name": null,
      "formatted_created_at": "Jul 19, 2018 8:03 PM",
      "formatted_updated_at": "Jul 19, 2018 8:03 PM",
      "global_filter_ids": [],
      "granular_access_levels": {
        "can_be_edited": false
      },
      "has_granular_permissions": false,
      "has_widgets_on_first_section": true,
      "icon": "icomoon-share",
      "icon_bg_color": "transparent",
      "id": "65",
      "is_dynamic": false,
      "is_favorite": false,
      "is_in_library": false,
      "is_locked": false,
      "is_predefined": true,
      "is_template": true,
      "layouts": {
        "65": {
          "created_at": 1532045030,
          "display_order": 1,
          "formatted_created_at": "Jul 19, 2018 8:03 PM",
          "formatted_updated_at": "Jul 16, 2020 10:20 PM",
          "id": "65",
          "is_in_library": false,
          "is_predefined": true,
          "metadata": {
            "custom_icon": null,
            "custom_icon_color": null,
            "description": null,
            "draw_options": {
              "show_background": {
                "metadata": {
                  "alpha": 1,
                  "color": "#FFFFFF"
                },
                "overridden": false,
                "value": true
              },
              "show_borders": {
                "metadata": {
                  "alpha": 1,
                  "color": "#EBEBEB",
                  "size": 1
                },
                "overridden": false,
                "value": true
              },
              "show_data_source": {
                "metadata": {},
                "overridden": false,
                "value": true
              },
              "show_header": {
                "metadata": {},
                "overridden": false,
                "value": true
              },
              "show_metric_name": {
                "metadata": {},
                "overridden": false,
                "value": true
              },
              "show_on_demand_badge": {
                "metadata": {},
                "overridden": false,
                "value": true
              },
              "show_shadow": {
                "metadata": {
                  "blur": 6,
                  "color": "#000000",
                  "x": 0,
                  "y": 3
                },
                "overridden": false,
                "value": false
              },
              "show_title": {
                "metadata": {},
                "overridden": false,
                "value": true
              },
              "show_widgets_with_no_data": {
                "metadata": {},
                "overridden": false,
                "value": true
              }
            },
            "export_options": {
              "draw_options": {
                "is_dark_mode": {
                  "overridden": false,
                  "value": false
                },
                "show_background": {
                  "overridden": true,
                  "value": false
                },
                "show_borders": {
                  "overridden": false,
                  "value": true
                },
                "show_data_source": {
                  "overridden": false,
                  "value": true
                },
                "show_header": {
                  "overridden": false,
                  "value": true
                },
                "show_page_footer": false,
                "show_page_header": false,
                "show_title": {
                  "overridden": false,
                  "value": true
                }
              },
              "orientation": "landscape"
            },
            "icon_mode": "default",
            "is_packed": true,
            "selected_entity": null,
            "tags": [],
            "thumbnail_metadata": null
          },
          "page_id": "65",
          "timegroup": "hourly",
          "title": "Untitled Section",
          "unique_id": null,
          "updated_at": 1594952406,
          "widgets": {
            "5159": {
              "assignments": null,
              "can_be_accessed": true,
              "can_be_copied": false,
              "can_be_deleted": false,
              "can_be_deleted_tooltip": null,
              "can_be_edited": false,
              "created_at": 0,
              "created_from_library": false,
              "data_source_id": "0",
              "data_type": "leads",
              "data_view_id": "0",
              "display_order": 2,
              "formatted_created_at": "N/A",
              "formatted_updated_at": "N/A",
              "has_live_integration": false,
              "height": 7,
              "id": "5159",
              "is_in_library": false,
              "is_predefined": false,
              "is_using_calculation": false,
              "layout_id": "65",
              "library_download_count": 0,
              "metadata": {
                "compare_to_prior_period": false,
                "comparison_end_date_override": null,
                "comparison_option": "month_over_month",
                "comparison_overwrite": [],
                "comparison_relative_date_range": "priorperiod",
                "comparison_start_date_override": null,
                "comparison_type": "prior_date_range",
                "comparison_type_display": "To Prior Date Range",
                "data_columns": {
                  "benchmarks": [],
                  "grouped": [],
                  "instance_benchmarks": [],
                  "selected": [
                    {
                      "aggregate_query": null,
                      "allows_null_value": false,
                      "alternate_field": null,
                      "audit_name_column": null,
                      "cell_class": null,
                      "concat_columns_split": ", ",
                      "custom_distinct_values": null,
                      "custom_sort": null,
                      "data_exporter": true,
                      "date_format": null,
                      "default_sort": null,
                      "dependencies": [],
                      "details_order": 954,
                      "edit_control_type": "link",
                      "edit_detail_group_id": null,
                      "enable_history": false,
                      "error": false,
                      "extra_parameters": [],
                      "field": "id",
                      "field_alias": null,
                      "filter_input_type": null,
                      "force_in_select": false,
                      "foreign_mapping": null,
                      "foreign_mapping_dependencies": [],
                      "format": "link",
                      "groupby_field_format": "link",
                      "groupby_id_field": "id",
                      "groupby_name_field": "id",
                      "has_set_values": false,
                      "ignore_set_data": false,
                      "is_audit_metadata_column": false,
                      "is_custom_cell_render": false,
                      "is_custom_edit_control": false,
                      "is_exportable": true,
                      "is_extra": false,
                      "is_filterable": false,
                      "is_foreign_audit_enabled": false,
                      "is_foreign_field": false,
                      "is_foreign_key": false,
                      "is_groupable": false,
                      "is_groupby_name_field": false,
                      "is_hidden": false,
                      "is_hidden_in_details": true,
                      "is_metric": false,
                      "is_most_recent_value": false,
                      "is_primary_date_field": false,
                      "is_primary_descriptive_name_field": false,
                      "is_primary_key": true,
                      "is_primary_name_field": false,
                      "is_private": false,
                      "is_pseudo": false,
                      "is_read_only": false,
                      "is_required": true,
                      "is_required_in_datatable": false,
                      "is_secret": false,
                      "is_selectable": true,
                      "is_sortable": false,
                      "is_taggable": false,
                      "is_unique": false,
                      "label": "Actions",
                      "original_date_format": null,
                      "placeholder": null,
                      "possible_discrepancy_warning": null,
                      "postprocess_type": "none",
                      "precision": null,
                      "query": null,
                      "show_on_group_by": false,
                      "sticky": false,
                      "summary_dependencies": [],
                      "summary_order": 10000,
                      "tag_default_value": null,
                      "tooltip": null,
                      "use_local_timezone": false,
                      "user_translation_field": false,
                      "value_data_source_type": null,
                      "values": [],
                      "width": null
                    },
                    {
                      "aggregate_query": null,
                      "allows_null_value": false,
                      "alternate_field": null,
                      "audit_name_column": null,
                      "cell_class": null,
                      "concat_columns_split": ", ",
                      "custom_distinct_values": null,
                      "custom_sort": null,
                      "data_exporter": true,
                      "date_format": null,
                      "default_sort": null,
                      "dependencies": [],
                      "details_order": 18,
                      "edit_control_type": "link",
                      "edit_detail_group_id": 2,
                      "enable_history": false,
                      "error": false,
                      "extra_parameters": [],
                      "field": "note_count",
                      "field_alias": null,
                      "filter_input_type": null,
                      "force_in_select": false,
                      "foreign_mapping": null,
                      "foreign_mapping_dependencies": [],
                      "format": "link",
                      "groupby_field_format": "link",
                      "groupby_id_field": "note_count",
                      "groupby_name_field": "note_count",
                      "has_set_values": false,
                      "ignore_set_data": false,
                      "is_audit_metadata_column": false,
                      "is_custom_cell_render": false,
                      "is_custom_edit_control": true,
                      "is_exportable": true,
                      "is_extra": false,
                      "is_filterable": false,
                      "is_foreign_audit_enabled": false,
                      "is_foreign_field": false,
                      "is_foreign_key": false,
                      "is_groupable": false,
                      "is_groupby_name_field": false,
                      "is_hidden": false,
                      "is_hidden_in_details": true,
                      "is_metric": false,
                      "is_most_recent_value": false,
                      "is_primary_date_field": false,
                      "is_primary_descriptive_name_field": false,
                      "is_primary_key": false,
                      "is_primary_name_field": false,
                      "is_private": false,
                      "is_pseudo": false,
                      "is_read_only": false,
                      "is_required": false,
                      "is_required_in_datatable": false,
                      "is_secret": false,
                      "is_selectable": true,
                      "is_sortable": true,
                      "is_taggable": false,
                      "is_unique": false,
                      "label": "Notes",
                      "original_date_format": null,
                      "placeholder": null,
                      "possible_discrepancy_warning": null,
                      "postprocess_type": "none",
                      "precision": null,
                      "query": null,
                      "show_on_group_by": false,
                      "sticky": false,
                      "summary_dependencies": [],
                      "summary_order": 1,
                      "tag_default_value": null,
                      "tooltip": null,
                      "use_local_timezone": false,
                      "user_translation_field": false,
                      "value_data_source_type": null,
                      "values": [],
                      "width": null
                    }
                  ]
                },
                "data_source": {
                  "color": "#3498db",
                  "data_view": "0",
                  "data_view_name": null,
                  "has_custom_icon": null,
                  "has_live_integration": false,
                  "icon": "icomoon-share",
                  "id": "0",
                  "id_name": "Leads",
                  "include_data_freshness_date": null,
                  "include_num_entities": null,
                  "is_custom_service": null,
                  "is_of_type_service": false,
                  "name": "Leads",
                  "primary_date_field": "timestamp",
                  "requires_date_range": true,
                  "requires_group_by": false,
                  "type": "leads"
                },
                "description": "A leads grid that allows you to view and edit all your leads in one place.",
                "draw_options": {
                  "display_length": 10,
                  "grid_collapse_in_modal": true,
                  "grid_full_image_size": false,
                  "grid_is_responsive": false,
                  "grid_paginate": true,
                  "grid_total_row_bottom": false,
                  "pivot_grid": false,
                  "plot_type": "classic",
                  "report_display_length": null,
                  "show_background": {
                    "overridden": false,
                    "value": true
                  },
                  "show_borders": {
                    "overridden": false,
                    "value": true
                  },
                  "show_data_source": {
                    "overridden": false,
                    "value": true
                  },
                  "show_header": {
                    "overridden": false,
                    "value": true
                  },
                  "show_sample_data": true,
                  "show_title": {
                    "overridden": false,
                    "value": true
                  },
                  "show_total_row": false
                },
                "dynamic": {
                  "alerts": [],
                  "annotations": [],
                  "errors": [],
                  "filter_set_name": null,
                  "filters": [],
                  "is_inactive": false,
                  "is_item_not_found": false,
                  "is_live_filter": false,
                  "predefined_data": null,
                  "predefined_filters": null,
                  "raw_data": null,
                  "warnings": []
                },
                "end_date_override": null,
                "export_options": null,
                "filter_set_id": null,
                "ignore_date_range": false,
                "is_overriding_date_range": false,
                "load_all_data": false,
                "product_widget_can_be_accessed": true,
                "relative_date_range": "default",
                "sort_by": [
                  "timestamp"
                ],
                "sort_order": [
                  "desc"
                ],
                "start_date_override": null,
                "tags": [],
                "thumbnail_metadata": null,
                "time_grouping": null,
                "time_grouping_display": null,
                "user_grouped_columns": [],
                "weekly_start_day": "sunday",
                "weekly_start_day_display": "Sunday",
                "widget_products": []
              },
              "report_id": null,
              "timegroup": "hourly",
              "title": "Leads Grid",
              "type": "datagrid",
              "type_display": "Data Grid",
              "unique_id": null,
              "updated_at": 0,
              "width": 12
            },
            "5160": {
              "assignments": null,
              "can_be_accessed": true,
              "can_be_copied": false,
              "can_be_deleted": false,
              "can_be_deleted_tooltip": null,
              "can_be_edited": false,
              "created_at": 0,
              "created_from_library": false,
              "data_source_id": "0",
              "data_type": "leads",
              "data_view_id": "0",
              "display_order": 3,
              "formatted_created_at": "N/A",
              "formatted_updated_at": "Jun 21, 2018 9:10 PM",
              "has_live_integration": false,
              "height": 7,
              "id": "5160",
              "is_in_library": false,
              "is_predefined": false,
              "is_using_calculation": false,
              "layout_id": "65",
              "library_download_count": 0,
              "metadata": {
                "chart_palette": null,
                "compare_to_prior_period": false,
                "comparison_end_date_override": null,
                "comparison_option": "month_over_month",
                "comparison_relative_date_range": "priorperiod",
                "comparison_start_date_override": null,
                "comparison_type": "prior_date_range",
                "comparison_type_display": "To Prior Date Range",
                "cumulative_columns": [],
                "data_columns": {
                  "benchmarks": [],
                  "grouped": [
                    {
                      "aggregate_query": null,
                      "allows_null_value": false,
                      "alternate_field": null,
                      "audit_name_column": null,
                      "cell_class": null,
                      "concat_columns_split": ", ",
                      "custom_distinct_values": null,
                      "custom_sort": null,
                      "data_exporter": true,
                      "date_format": null,
                      "default_sort": null,
                      "dependencies": [],
                      "details_order": 0,
                      "edit_control_type": "text",
                      "edit_detail_group_id": null,
                      "enable_history": false,
                      "error": false,
                      "extra_parameters": [],
                      "field": "service_id",
                      "field_alias": null,
                      "filter_input_type": null,
                      "force_in_select": false,
                      "foreign_mapping": null,
                      "foreign_mapping_dependencies": [],
                      "format": "id",
                      "groupby_field_format": "id",
                      "groupby_id_field": "service_id",
                      "groupby_name_field": "service_name",
                      "has_set_values": false,
                      "ignore_set_data": false,
                      "is_audit_metadata_column": false,
                      "is_custom_cell_render": false,
                      "is_custom_edit_control": false,
                      "is_exportable": true,
                      "is_extra": false,
                      "is_filterable": true,
                      "is_foreign_audit_enabled": false,
                      "is_foreign_field": false,
                      "is_foreign_key": false,
                      "is_groupable": true,
                      "is_groupby_name_field": false,
                      "is_hidden": true,
                      "is_hidden_in_details": true,
                      "is_metric": false,
                      "is_most_recent_value": false,
                      "is_primary_date_field": false,
                      "is_primary_descriptive_name_field": false,
                      "is_primary_key": false,
                      "is_primary_name_field": false,
                      "is_private": false,
                      "is_pseudo": false,
                      "is_read_only": false,
                      "is_required": true,
                      "is_required_in_datatable": false,
                      "is_secret": false,
                      "is_selectable": true,
                      "is_sortable": true,
                      "is_taggable": false,
                      "is_unique": false,
                      "label": "Data Source",
                      "original_date_format": null,
                      "placeholder": null,
                      "possible_discrepancy_warning": null,
                      "postprocess_type": "none",
                      "precision": null,
                      "query": null,
                      "show_on_group_by": false,
                      "sticky": false,
                      "summary_dependencies": [],
                      "summary_order": 1397,
                      "tag_default_value": null,
                      "tooltip": null,
                      "use_local_timezone": false,
                      "user_translation_field": false,
                      "value_data_source_type": null,
                      "values": [],
                      "width": null
                    },
                    {
                      "aggregate_query": null,
                      "allows_null_value": false,
                      "alternate_field": null,
                      "audit_name_column": null,
                      "cell_class": null,
                      "concat_columns_split": ", ",
                      "custom_distinct_values": null,
                      "custom_sort": null,
                      "data_exporter": true,
                      "date_format": null,
                      "default_sort": null,
                      "dependencies": [],
                      "details_order": 1440,
                      "edit_control_type": "text",
                      "edit_detail_group_id": 3,
                      "enable_history": false,
                      "error": false,
                      "extra_parameters": [],
                      "field": "timestamp",
                      "field_alias": null,
                      "filter_input_type": null,
                      "force_in_select": false,
                      "foreign_mapping": null,
                      "foreign_mapping_dependencies": [],
                      "format": "datetime",
                      "groupby_field_format": "datetime",
                      "groupby_id_field": "timestamp",
                      "groupby_name_field": "timestamp",
                      "has_set_values": false,
                      "ignore_set_data": false,
                      "is_audit_metadata_column": false,
                      "is_custom_cell_render": false,
                      "is_custom_edit_control": false,
                      "is_exportable": true,
                      "is_extra": false,
                      "is_filterable": false,
                      "is_foreign_audit_enabled": false,
                      "is_foreign_field": false,
                      "is_foreign_key": false,
                      "is_groupable": true,
                      "is_groupby_name_field": false,
                      "is_hidden": false,
                      "is_hidden_in_details": false,
                      "is_metric": false,
                      "is_most_recent_value": false,
                      "is_primary_date_field": true,
                      "is_primary_descriptive_name_field": false,
                      "is_primary_key": false,
                      "is_primary_name_field": true,
                      "is_private": false,
                      "is_pseudo": false,
                      "is_read_only": true,
                      "is_required": true,
                      "is_required_in_datatable": false,
                      "is_secret": false,
                      "is_selectable": true,
                      "is_sortable": true,
                      "is_taggable": false,
                      "is_unique": false,
                      "label": "Time Logged",
                      "original_date_format": null,
                      "placeholder": null,
                      "possible_discrepancy_warning": null,
                      "postprocess_type": "datetime",
                      "precision": null,
                      "query": null,
                      "show_on_group_by": false,
                      "sticky": false,
                      "summary_dependencies": [],
                      "summary_order": 2,
                      "tag_default_value": null,
                      "tooltip": null,
                      "use_local_timezone": true,
                      "user_translation_field": false,
                      "value_data_source_type": null,
                      "values": [],
                      "width": null
                    }
                  ],
                  "instance_benchmarks": [],
                  "selected": [
                    {
                      "aggregate_query": null,
                      "allows_null_value": false,
                      "alternate_field": null,
                      "audit_name_column": null,
                      "cell_class": null,
                      "concat_columns_split": ", ",
                      "custom_distinct_values": null,
                      "custom_sort": null,
                      "data_exporter": true,
                      "date_format": null,
                      "default_sort": null,
                      "dependencies": [],
                      "details_order": 1458,
                      "edit_control_type": "number",
                      "edit_detail_group_id": null,
                      "enable_history": false,
                      "error": false,
                      "extra_parameters": [],
                      "field": "row_grouping_count",
                      "field_alias": null,
                      "filter_input_type": null,
                      "force_in_select": false,
                      "foreign_mapping": null,
                      "foreign_mapping_dependencies": [],
                      "format": "integer",
                      "groupby_field_format": "integer",
                      "groupby_id_field": "row_grouping_count",
                      "groupby_name_field": "row_grouping_count",
                      "has_set_values": false,
                      "ignore_set_data": false,
                      "is_audit_metadata_column": false,
                      "is_custom_cell_render": false,
                      "is_custom_edit_control": false,
                      "is_exportable": true,
                      "is_extra": false,
                      "is_filterable": true,
                      "is_foreign_audit_enabled": false,
                      "is_foreign_field": false,
                      "is_foreign_key": false,
                      "is_groupable": false,
                      "is_groupby_name_field": false,
                      "is_hidden": false,
                      "is_hidden_in_details": false,
                      "is_metric": true,
                      "is_most_recent_value": false,
                      "is_primary_date_field": false,
                      "is_primary_descriptive_name_field": false,
                      "is_primary_key": false,
                      "is_primary_name_field": false,
                      "is_private": false,
                      "is_pseudo": false,
                      "is_read_only": false,
                      "is_required": true,
                      "is_required_in_datatable": false,
                      "is_secret": false,
                      "is_selectable": true,
                      "is_sortable": true,
                      "is_taggable": false,
                      "is_unique": false,
                      "label": "Leads Count",
                      "original_date_format": null,
                      "placeholder": null,
                      "possible_discrepancy_warning": null,
                      "postprocess_type": "none",
                      "precision": 0,
                      "query": {
                        "coefficient": null,
                        "expression": "COUNT(*)",
                        "fields": "*",
                        "table_alias": null,
                        "type": "count"
                      },
                      "show_on_group_by": true,
                      "sticky": false,
                      "summary_dependencies": [],
                      "summary_order": 1459,
                      "tag_default_value": null,
                      "tooltip": null,
                      "use_local_timezone": false,
                      "user_translation_field": false,
                      "value_data_source_type": null,
                      "values": [],
                      "width": null
                    },
                    {
                      "aggregate_query": null,
                      "allows_null_value": false,
                      "alternate_field": null,
                      "audit_name_column": null,
                      "cell_class": null,
                      "concat_columns_split": ", ",
                      "custom_distinct_values": null,
                      "custom_sort": null,
                      "data_exporter": true,
                      "date_format": null,
                      "default_sort": null,
                      "dependencies": [],
                      "details_order": 1426,
                      "edit_control_type": "number",
                      "edit_detail_group_id": 3,
                      "enable_history": false,
                      "error": false,
                      "extra_parameters": [],
                      "field": "answer_count",
                      "field_alias": null,
                      "filter_input_type": null,
                      "force_in_select": false,
                      "foreign_mapping": null,
                      "foreign_mapping_dependencies": [],
                      "format": "integer",
                      "groupby_field_format": "integer",
                      "groupby_id_field": "answer_count",
                      "groupby_name_field": "answer_count",
                      "has_set_values": false,
                      "ignore_set_data": false,
                      "is_audit_metadata_column": false,
                      "is_custom_cell_render": false,
                      "is_custom_edit_control": false,
                      "is_exportable": true,
                      "is_extra": false,
                      "is_filterable": true,
                      "is_foreign_audit_enabled": false,
                      "is_foreign_field": false,
                      "is_foreign_key": false,
                      "is_groupable": false,
                      "is_groupby_name_field": false,
                      "is_hidden": false,
                      "is_hidden_in_details": false,
                      "is_metric": true,
                      "is_most_recent_value": false,
                      "is_primary_date_field": false,
                      "is_primary_descriptive_name_field": false,
                      "is_primary_key": false,
                      "is_primary_name_field": false,
                      "is_private": false,
                      "is_pseudo": false,
                      "is_read_only": false,
                      "is_required": true,
                      "is_required_in_datatable": false,
                      "is_secret": false,
                      "is_selectable": true,
                      "is_sortable": true,
                      "is_taggable": false,
                      "is_unique": false,
                      "label": "Answers",
                      "original_date_format": null,
                      "placeholder": null,
                      "possible_discrepancy_warning": null,
                      "postprocess_type": "numeric",
                      "precision": 0,
                      "query": {
                        "coefficient": null,
                        "expression": "SUM(answer_count)",
                        "fields": "answer_count",
                        "table_alias": null,
                        "type": "sum"
                      },
                      "show_on_group_by": true,
                      "sticky": false,
                      "summary_dependencies": [],
                      "summary_order": 1427,
                      "tag_default_value": null,
                      "tooltip": null,
                      "use_local_timezone": false,
                      "user_translation_field": false,
                      "value_data_source_type": null,
                      "values": [],
                      "width": null
                    }
                  ]
                },
                "data_source": {
                  "color": "#3498db",
                  "data_view": "0",
                  "data_view_name": null,
                  "has_custom_icon": null,
                  "has_live_integration": false,
                  "icon": "icomoon-share",
                  "id": "0",
                  "id_name": "Leads",
                  "include_data_freshness_date": null,
                  "include_num_entities": null,
                  "is_custom_service": null,
                  "is_of_type_service": false,
                  "name": "Leads",
                  "primary_date_field": "timestamp",
                  "requires_date_range": true,
                  "requires_group_by": false,
                  "type": "leads"
                },
                "description": "A rollup of your leads by service.",
                "draw_options": {
                  "angle": 0,
                  "depth": 0,
                  "grid_is_responsive": false,
                  "has_bullets": true,
                  "has_legend": true,
                  "has_tooltip": true,
                  "has_value_scroller": false,
                  "is_hand_drawn": false,
                  "is_normalized": false,
                  "is_rotated": false,
                  "is_smoothed_line": false,
                  "is_zero_scaled": true,
                  "plot_type": "clustered(v2)",
                  "show_background": {
                    "overridden": false,
                    "value": true
                  },
                  "show_borders": {
                    "overridden": false,
                    "value": true
                  },
                  "show_data_source": {
                    "overridden": false,
                    "value": true
                  },
                  "show_empty_dates": false,
                  "show_header": {
                    "overridden": false,
                    "value": true
                  },
                  "show_labels": true,
                  "show_metric_labels": false,
                  "show_sample_data": true,
                  "show_title": {
                    "overridden": false,
                    "value": true
                  }
                },
                "dynamic": {
                  "alerts": [],
                  "annotations": [],
                  "errors": [],
                  "filter_set_name": null,
                  "filters": [],
                  "is_inactive": false,
                  "is_item_not_found": false,
                  "is_live_filter": false,
                  "predefined_data": null,
                  "predefined_filters": null,
                  "raw_data": null,
                  "warnings": []
                },
                "end_date_override": null,
                "export_options": null,
                "filter_set_id": null,
                "ignore_date_range": false,
                "is_multi_grouped": false,
                "is_overriding_date_range": false,
                "line_columns": [],
                "move_y_axes": {},
                "product_widget_can_be_accessed": true,
                "relative_date_range": "default",
                "sort_by": [],
                "sort_order": [],
                "start_date_override": null,
                "tags": [],
                "thumbnail_metadata": null,
                "time_grouping": "monthly",
                "time_grouping_display": "By month",
                "weekly_start_day": "sunday",
                "weekly_start_day_display": "Sunday",
                "widget_products": []
              },
              "report_id": null,
              "timegroup": "hourly",
              "title": "Lead Count by Service",
              "type": "barchart",
              "type_display": "Bar Chart",
              "unique_id": null,
              "updated_at": 1529629852,
              "width": 12
            }
          }
        }
      },
      "metadata": {
        "append_exported_datagrids": false,
        "append_exported_datagrids_to_layout": false,
        "chart_palette": [
          "#0665a2",
          "#ffc930"
        ],
        "client_naics_code": null,
        "client_naics_title": null,
        "created_from": "",
        "dashboard_filters": null,
        "description": null,
        "disable_comparison": true,
        "disable_dash_filters": false,
        "font_size": "small",
        "hide_empty_exported_widgets": false,
        "include_summary_page": false,
        "selected_entity": null,
        "tags": []
      },
      "module": null,
      "reporting_profiles": null,
      "timegroup": "hourly",
      "title": "Leads Dashboard",
      "type": "dash",
      "type_display": "Dashboards",
      "unique_id": "3091319261",
      "updated_at": 1532045030,
      "widget_data_warehouse_types": "-",
      "widget_data_warehouse_types_display": "-",
      "widget_ids": [
        "5159",
        "5160"
      ]
    }
  },
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (16)

- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 1x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 1x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 1x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 1x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 1x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 1x)
- `cookie adminhtml` comes from `GET /server/api/dash/dashboardfilters/view` `set-cookie adminhtml` (seen 1x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 1x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/categories` `cookie adminhtml`
- `response.body $.data.page.widget_ids[0]` feeds `GET /server/api/leads` `query widget_request`
- `response.body $.data.page.layouts.65.widgets.5159.type` feeds `GET /server/api/leads` `query widget_type`
- `response.body $.data.page.layouts.65.widgets.5159.metadata.data_columns.selected[2].field` feeds `GET /server/api/leads` `query sort`
- `response.body $.data.page.layouts.65.widgets.5159.metadata.data_columns.selected[3].groupby_id_field` feeds `GET /server/api/leads` `query groupby`
- `response.body $.data.page.widget_ids[1]` feeds `GET /server/api/leads` `query widget_request`
- `response.body $.data.page.layouts.65.widgets.5160.type` feeds `GET /server/api/leads` `query widget_type`

**Observed in** (1)

- YP Metrics tour, step `open-leads`, run `20261104T214824Z-f674`, 2026-11-04T21:51:38.793Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.951:0`

### `GET /server/api/dash/pages`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `all` | query | literal | `true` | no |
| `is_predefined` | query | literal | `false` | no |
| `is_in_library` | query | literal | `false` | no |
| `strict` | query | literal | `1` | no |
| `fields` | query | literal | `id,title,is_predefined,is_in_library,is_favorite,can_favorite,is_template,is_locked,reporting_profiles,cluster,folder_id,folder_name,metadata,has_widgets_on_first_section,updated_at,created_at` | no |
| `extra` | query | literal | `true` | no |
| `datatable` | query | literal | `true` | yes |
| `summary` | query | literal | `true` | yes |
| `sort` | query | literal | `title` | yes |
| `page` | query | literal | `0,50` | yes |
| `query_id` | query | computed | `71b3a6df-fcdb-4d83-abc3-96fd0ff0bbee` | yes |
| `metadata` | query | literal | `true` | no |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "anyOf": [
        {
          "properties": {
            "aaData": {
              "items": {
                "properties": {
                  "can_be_accessed": {
                    "type": "boolean"
                  },
                  "can_be_copied": {
                    "type": "boolean"
                  },
                  "can_be_deleted": {
                    "type": "boolean"
                  },
                  "can_be_deleted_tooltip": {
                    "type": "null"
                  },
                  "can_be_edited": {
                    "type": "boolean"
                  },
                  "can_be_listed": {
                    "type": "boolean"
                  },
                  "can_favorite": {
                    "type": "boolean"
                  },
                  "cluster": {
                    "type": "null"
                  },
                  "created_at": {
                    "type": "integer"
                  },
                  "entity": {
                    "type": "null"
                  },
                  "folder_id": {
                    "type": "null"
                  },
                  "folder_name": {
                    "type": "null"
                  },
                  "formatted_created_at": {
                    "type": "string"
                  },
                  "formatted_updated_at": {
                    "type": "string"
                  },
                  "granular_access_levels": {
                    "properties": {
                      "can_be_edited": {
                        "type": "boolean"
                      }
                    },
                    "required": [
                      "can_be_edited"
                    ],
                    "type": "object"
                  },
                  "has_granular_permissions": {
                    "type": "boolean"
                  },
                  "has_widgets_on_first_section": {
                    "type": "boolean"
                  },
                  "id": {
                    "type": "string"
                  },
                  "is_favorite": {
                    "type": "boolean"
                  },
                  "is_in_library": {
                    "type": "boolean"
                  },
                  "is_locked": {
                    "type": "boolean"
                  },
                  "is_predefined": {
                    "type": "boolean"
                  },
                  "is_template": {
                    "type": "boolean"
                  },
                  "metadata": {
                    "properties": {
                      "append_exported_datagrids": {
                        "type": "boolean"
                      },
                      "append_exported_datagrids_to_layout": {
                        "type": "boolean"
                      },
                      "chart_palette": {
                        "items": {
                          "type": "string"
                        },
                        "type": "array"
                      },
                      "client_naics_code": {
                        "type": "null"
                      },
                      "client_naics_title": {
                        "type": "null"
                      },
                      "created_from": {
                        "type": "string"
                      },
                      "dashboard_filters": {
                        "type": "null"
                      },
                      "datagrid_with_fixed_header_size": {
                        "type": "boolean"
                      },
                      "description": {
                        "type": "null"
                      },
                      "disable_comparison": {
                        "type": "boolean"
                      },
                      "disable_dash_filters": {
                        "type": "boolean"
                      },
                      "font_size": {
                        "type": "string"
                      },
                      "hide_empty_exported_widgets": {
                        "type": "boolean"
                      },
                      "include_summary_page": {
                        "type": "boolean"
                      },
                      "requires_refresh_on_date_range_change": {
                        "type": "boolean"
                      },
                      "selected_entity": {
                        "type": "null"
                      },
                      "tags": {
                        "type": "array"
                      }
                    },
                    "required": [
                      "selected_entity",
                      "chart_palette",
                      "font_size",
                      "append_exported_datagrids",
                      "append_exported_datagrids_to_layout",
                      "hide_empty_exported_widgets",
                      "description",
                      "dashboard_filters",
                      "disable_dash_filters",
                      "disable_comparison",
                      "tags",
                      "requires_refresh_on_date_range_change",
                      "include_summary_page",
                      "created_from",
                      "client_naics_code",
                      "client_naics_title"
                    ],
                    "type": "object"
                  },
                  "reporting_profiles": {
                    "items": {
                      "properties": {
                        "id": {
                          "type": "string"
                        },
                        "name": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "id",
                        "name"
                      ],
                      "type": "object"
                    },
                    "type": "array"
                  },
                  "timegroup": {
                    "type": "string"
                  },
                  "title": {
                    "type": "string"
                  },
                  "updated_at": {
                    "type": "integer"
                  }
                },
                "required": [
                  "id",
                  "title",
                  "is_predefined",
                  "is_in_library",
                  "is_template",
                  "metadata",
                  "updated_at",
                  "created_at",
                  "entity",
                  "is_favorite",
                  "reporting_profiles",
                  "cluster",
                  "folder_id",
                  "folder_name",
                  "is_locked",
                  "can_favorite",
                  "timegroup",
                  "formatted_created_at",
                  "formatted_updated_at",
                  "has_widgets_on_first_section",
                  "has_granular_permissions",
                  "granular_access_levels",
                  "can_be_accessed",
                  "can_be_edited",
                  "can_be_deleted",
                  "can_be_copied",
                  "can_be_deleted_tooltip",
                  "can_be_listed"
                ],
                "type": "object"
              },
              "type": "array"
            },
            "iTotalDisplayRecords": {
              "type": "integer"
            },
            "iTotalRecords": {
              "type": "integer"
            },
            "sEcho": {
              "type": "string"
            }
          },
          "required": [
            "sEcho",
            "iTotalRecords",
            "iTotalDisplayRecords",
            "aaData"
          ],
          "type": "object"
        },
        {
          "type": "array"
        }
      ]
    },
    "error": {
      "type": "boolean"
    },
    "metadata": {
      "properties": {
        "columns": {
          "items": {
            "properties": {
              "allows_null_value": {
                "type": "boolean"
              },
              "audit_name_column": {
                "type": "null"
              },
              "cell_class": {
                "type": "null"
              },
              "concat_columns_split": {
                "type": "string"
              },
              "custom_sort": {
                "type": "null"
              },
              "data_exporter": {
                "type": "boolean"
              },
              "default_sort": {
                "type": "null"
              },
              "details_order": {
                "type": "integer"
              },
              "edit_detail_group_id": {
                "type": "null"
              },
              "enable_history": {
                "type": "boolean"
              },
              "feature_scope": {
                "items": {
                  "type": "string"
                },
                "type": "array"
              },
              "field": {
                "type": "string"
              },
              "filter_input_type": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "foreign_mapping": {
                "properties": {
                  "clause_conditions": {
                    "items": {
                      "properties": {
                        "clause_operator": {
                          "type": "string"
                        },
                        "condition_operator": {
                          "type": "string"
                        },
                        "foreign_field": {
                          "type": "string"
                        },
                        "source_field": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "source_field",
                        "foreign_field",
                        "condition_operator",
                        "clause_operator"
                      ],
                      "type": "object"
                    },
                    "type": "array"
                  },
                  "default_null_display_value": {
                    "type": "null"
                  },
                  "foreign_dependencies": {
                    "type": "array"
                  },
                  "foreign_entity_field": {
                    "type": "null"
                  },
                  "foreign_entity_route": {
                    "type": "string"
                  },
                  "foreign_expression_fields": {
                    "anyOf": [
                      {
                        "properties": {
                          "cluster": {
                            "type": "string"
                          },
                          "is_favorite": {
                            "type": "string"
                          },
                          "is_locked": {
                            "type": "object"
                          },
                          "reporting_profiles": {
                            "type": "string"
                          }
                        },
                        "type": "object"
                      },
                      {
                        "type": "array"
                      }
                    ]
                  },
                  "foreign_fields": {
                    "properties": {
                      "cluster": {
                        "type": "string"
                      },
                      "folder_name": {
                        "type": "string"
                      },
                      "is_favorite": {
                        "type": "string"
                      },
                      "is_locked": {
                        "type": "string"
                      },
                      "reporting_profiles": {
                        "type": "string"
                      }
                    },
                    "type": "object"
                  },
                  "foreign_is_service_data_table": {
                    "type": "boolean"
                  },
                  "foreign_table_alias": {
                    "type": "null"
                  },
                  "foreign_table_name": {
                    "type": "string"
                  },
                  "foreign_values_route": {
                    "type": "string"
                  },
                  "has_object_mapping": {
                    "type": "boolean"
                  },
                  "intermediary_mappings": {
                    "items": {
                      "properties": {
                        "clause_conditions": {
                          "items": {
                            "type": "object"
                          },
                          "type": "array"
                        },
                        "default_null_display_value": {
                          "type": "null"
                        },
                        "foreign_dependencies": {
                          "type": "array"
                        },
                        "foreign_entity_field": {
                          "type": "null"
                        },
                        "foreign_entity_route": {
                          "type": "string"
                        },
                        "foreign_expression_fields": {
                          "type": "array"
                        },
                        "foreign_fields": {
                          "type": "array"
                        },
                        "foreign_is_service_data_table": {
                          "type": "boolean"
                        },
                        "foreign_table_alias": {
                          "type": "null"
                        },
                        "foreign_table_name": {
                          "type": "string"
                        },
                        "foreign_values_route": {
                          "type": "string"
                        },
                        "has_object_mapping": {
                          "type": "boolean"
                        },
                        "intermediary_mappings": {
                          "type": "array"
                        },
                        "is_expression_mapping": {
                          "type": "boolean"
                        },
                        "is_forceful_mapping": {
                          "type": "null"
                        },
                        "is_intermediary_join": {
                          "type": "boolean"
                        },
                        "join_type": {
                          "type": "string"
                        },
                        "object_mapping_fields": {
                          "type": "null"
                        },
                        "object_mapping_key": {
                          "type": "null"
                        },
                        "param_bindings": {
                          "type": "null"
                        },
                        "query_type": {
                          "type": "null"
                        },
                        "source_join_table_name": {
                          "type": "string"
                        },
                        "sub_query_fields": {
                          "type": "null"
                        }
                      },
                      "required": [
                        "foreign_table_name",
                        "foreign_fields",
                        "foreign_expression_fields",
                        "foreign_table_alias",
                        "foreign_entity_route",
                        "foreign_values_route",
                        "source_join_table_name",
                        "default_null_display_value",
                        "join_type",
                        "clause_conditions",
                        "is_intermediary_join",
                        "is_forceful_mapping",
                        "is_expression_mapping",
                        "has_object_mapping",
                        "intermediary_mappings",
                        "query_type",
                        "object_mapping_key",
                        "object_mapping_fields",
                        "foreign_entity_field",
                        "foreign_is_service_data_table",
                        "param_bindings",
                        "foreign_dependencies",
                        "sub_query_fields"
                      ],
                      "type": "object"
                    },
                    "type": "array"
                  },
                  "is_expression_mapping": {
                    "type": "boolean"
                  },
                  "is_forceful_mapping": {
                    "type": "null"
                  },
                  "is_intermediary_join": {
                    "type": "boolean"
                  },
                  "join_type": {
                    "type": "string"
                  },
                  "object_mapping_fields": {
                    "type": "null"
                  },
                  "object_mapping_key": {
                    "type": "null"
                  },
                  "param_bindings": {
                    "type": "null"
                  },
                  "query_type": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "source_join_table_name": {
                    "type": "string"
                  },
                  "sub_query_fields": {
                    "type": "null"
                  }
                },
                "required": [
                  "foreign_table_name",
                  "foreign_fields",
                  "foreign_expression_fields",
                  "foreign_table_alias",
                  "foreign_entity_route",
                  "foreign_values_route",
                  "source_join_table_name",
                  "default_null_display_value",
                  "join_type",
                  "clause_conditions",
                  "is_intermediary_join",
                  "is_forceful_mapping",
                  "is_expression_mapping",
                  "has_object_mapping",
                  "intermediary_mappings",
                  "query_type",
                  "object_mapping_key",
                  "object_mapping_fields",
                  "foreign_entity_field",
                  "foreign_is_service_data_table",
                  "param_bindings",
                  "foreign_dependencies",
                  "sub_query_fields"
                ],
                "type": [
                  "object",
                  "null"
                ]
              },
              "foreign_mapping_dependencies": {
                "type": "array"
              },
              "format": {
                "type": "string"
              },
              "has_set_values": {
                "type": "boolean"
              },
              "is_audit_metadata_column": {
                "type": "boolean"
              },
              "is_custom_cell_render": {
                "type": "boolean"
              },
              "is_exportable": {
                "type": "boolean"
              },
              "is_filterable": {
                "type": "boolean"
              },
              "is_foreign_audit_enabled": {
                "type": "boolean"
              },
              "is_foreign_field": {
                "type": "boolean"
              },
              "is_foreign_key": {
                "type": "boolean"
              },
              "is_groupable": {
                "type": "boolean"
              },
              "is_groupby_name_field": {
                "type": "boolean"
              },
              "is_hidden": {
                "type": "boolean"
              },
              "is_metric": {
                "type": "boolean"
              },
              "is_most_recent_value": {
                "type": "boolean"
              },
              "is_primary_key": {
                "type": "boolean"
              },
              "is_primary_name_field": {
                "type": "boolean"
              },
              "is_pseudo": {
                "type": "boolean"
              },
              "is_read_only": {
                "type": "boolean"
              },
              "is_required_in_datatable": {
                "type": "boolean"
              },
              "is_sortable": {
                "type": "boolean"
              },
              "is_taggable": {
                "type": "boolean"
              },
              "label": {
                "type": "string"
              },
              "original_date_format": {
                "type": "null"
              },
              "postprocess_type": {
                "type": "string"
              },
              "precision": {
                "type": "null"
              },
              "sticky": {
                "type": "boolean"
              },
              "summary_dependencies": {
                "type": "array"
              },
              "summary_order": {
                "type": "integer"
              },
              "tooltip": {
                "type": "null"
              },
              "values": {
                "items": {
                  "properties": {
                    "key": {
                      "type": "string"
                    },
                    "value": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "key",
                    "value"
                  ],
                  "type": "object"
                },
                "type": "array"
              },
              "width": {
                "type": "null"
              }
            },
            "required": [
              "field",
              "label",
              "format",
              "values",
              "has_set_values",
              "details_order",
              "summary_order",
              "is_sortable",
              "cell_class",
              "width",
              "custom_sort",
              "default_sort",
              "tooltip",
              "postprocess_type",
              "is_read_only",
              "allows_null_value",
              "is_hidden",
              "is_primary_key",
              "is_primary_name_field",
              "original_date_format",
              "is_foreign_key",
              "is_foreign_field",
              "foreign_mapping",
              "foreign_mapping_dependencies",
              "concat_columns_split",
              "is_pseudo",
              "is_custom_cell_render",
              "is_groupable",
              "is_filterable",
              "sticky",
              "filter_input_type",
              "is_groupby_name_field",
              "is_most_recent_value",
              "is_metric",
              "precision",
              "enable_history",
              "is_taggable",
              "summary_dependencies",
              "edit_detail_group_id",
              "is_exportable",
              "is_required_in_datatable",
              "is_foreign_audit_enabled",
              "audit_name_column",
              "is_audit_metadata_column",
              "data_exporter"
            ],
            "type": "object"
          },
          "type": "array"
        }
      },
      "required": [
        "columns"
      ],
      "type": "object"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": {
    "aaData": [
      {
        "can_be_accessed": true,
        "can_be_copied": false,
        "can_be_deleted": false,
        "can_be_deleted_tooltip": null,
        "can_be_edited": false,
        "can_be_listed": true,
        "can_favorite": false,
        "cluster": null,
        "created_at": 1771517877,
        "entity": null,
        "folder_id": null,
        "folder_name": null,
        "formatted_created_at": "Feb 19, 2026 11:17 AM",
        "formatted_updated_at": "Aug 24, 2026 8:19 AM",
        "granular_access_levels": {
          "can_be_edited": false
        },
        "has_granular_permissions": false,
        "has_widgets_on_first_section": true,
        "id": "139",
        "is_favorite": true,
        "is_in_library": false,
        "is_locked": false,
        "is_predefined": false,
        "is_template": false,
        "metadata": {
          "append_exported_datagrids": false,
          "append_exported_datagrids_to_layout": false,
          "chart_palette": [
            "#1E9AD6",
            "#EE4036"
          ],
          "client_naics_code": null,
          "client_naics_title": null,
          "created_from": "",
          "dashboard_filters": null,
          "description": null,
          "disable_comparison": false,
          "disable_dash_filters": false,
          "font_size": "small",
          "hide_empty_exported_widgets": true,
          "include_summary_page": false,
          "requires_refresh_on_date_range_change": true,
          "selected_entity": null,
          "tags": []
        },
        "reporting_profiles": [
          {
            "id": "1",
            "name": "Default Profile"
          }
        ],
        "timegroup": "hourly",
        "title": "PJ Métriques - Français",
        "updated_at": 1787573965
      },
      {
        "can_be_accessed": true,
        "can_be_copied": false,
        "can_be_deleted": false,
        "can_be_deleted_tooltip": null,
        "can_be_edited": false,
        "can_be_listed": true,
        "can_favorite": false,
        "cluster": null,
        "created_at": 1774035195,
        "entity": null,
        "folder_id": null,
        "folder_name": null,
        "formatted_created_at": "Mar 20, 2026 3:33 PM",
        "formatted_updated_at": "Nov 04, 2026 11:50 AM",
        "granular_access_levels": {
          "can_be_edited": false
        },
        "has_granular_permissions": false,
        "has_widgets_on_first_section": true,
        "id": "92",
        "is_favorite": true,
        "is_in_library": false,
        "is_locked": false,
        "is_predefined": false,
        "is_template": false,
        "metadata": {
          "append_exported_datagrids": true,
          "append_exported_datagrids_to_layout": false,
          "chart_palette": [
            "#1E9AD6",
            "#EE4036"
          ],
          "client_naics_code": null,
          "client_naics_title": null,
          "created_from": "",
          "dashboard_filters": null,
          "datagrid_with_fixed_header_size": true,
          "description": null,
          "disable_comparison": false,
          "disable_dash_filters": false,
          "font_size": "small",
          "hide_empty_exported_widgets": false,
          "include_summary_page": false,
          "requires_refresh_on_date_range_change": true,
          "selected_entity": null,
          "tags": []
        },
        "reporting_profiles": [
          {
            "id": "1",
            "name": "Default Profile"
          }
        ],
        "timegroup": "hourly",
        "title": "YP Metrics - English",
        "updated_at": 1793811051
      }
    ],
    "iTotalDisplayRecords": 2,
    "iTotalRecords": 2,
    "sEcho": "prod"
  },
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (12)

- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 2x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 2x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 2x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 2x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 2x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 2x)
- `cookie adminhtml` comes from `GET /server/api/dashfolders` `set-cookie adminhtml` (seen 1x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 2x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 2x)
- `cookie adminhtml` comes from `GET /server/api/dash/pages` `set-cookie adminhtml` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/dash/pages` `cookie adminhtml`
- `set-cookie adminhtml` feeds `POST /server/api/dashfiles/listusage` `cookie adminhtml`

**Observed in** (2)

- YP Metrics tour, step `open-dashboards`, run `20261104T214824Z-f674`, 2026-11-04T21:49:07.780Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.826:0`
- YP Metrics tour, step `open-dashboards`, run `20261104T214824Z-f674`, 2026-11-04T21:49:07.780Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.827:0`

### `GET /server/api/dash/pages/isleads/{isleadId}`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `isleadId` | path | literal | `92` | yes |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "type": "boolean"
    },
    "error": {
      "type": "boolean"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": false,
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (18)

- `cookie ajs_user_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.userEmail` (seen 3x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 17x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 17x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 17x)
- `cookie ajs_group_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.instanceURL` (seen 3x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 15x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 15x)
- `cookie SimpleSAMLAuthToken` comes from `POST /simplesaml/module.php/saml/sp/saml2-acs.php/mymetrics_yp_ca_activedirectory_ypcanada` `set-cookie SimpleSAMLAuthToken` (seen 3x)
- `cookie adminhtml` comes from `GET /server/api/session/initUser` `set-cookie adminhtml` (seen 1x)
- `cookie adminhtml` comes from `GET /server/api/services` `set-cookie adminhtml` (seen 2x)
- `cookie adminhtml` comes from `GET /server/api/dash/{dashId}` `set-cookie adminhtml` (seen 9x)
- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 14x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 14x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 14x)
- `cookie adminhtml` comes from `storage` `storage cookie[adminhtml]` (seen 3x)
- `cookie adminhtml` comes from `GET /server/api/categories` `set-cookie adminhtml` (seen 2x)
- `set-cookie adminhtml` feeds `GET /server/api/dash/widgets/{widgetId}/data` `cookie adminhtml`
- `set-cookie adminhtml` feeds `GET /server/api/dash/{dashId}` `cookie adminhtml`

**Observed in** (17)

- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:33.736Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.712:0`
- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:35.304Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.790:0`
- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:35.305Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.792:0`
- YP Metrics tour, step `open-fav-dashboards-92`, run `20261104T214824Z-f674`, 2026-11-04T21:49:29.281Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.842:0`
- YP Metrics tour, step `open-fav-dashboards-92`, run `20261104T214824Z-f674`, 2026-11-04T21:49:30.153Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.853:0`
- YP Metrics tour, step `open-fav-dashboards-92`, run `20261104T214824Z-f674`, 2026-11-04T21:49:30.153Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.855:0`
- YP Metrics tour, step `open-fav-dashboards-139`, run `20261104T214824Z-f674`, 2026-11-04T21:49:50.859Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.876:0`
- YP Metrics tour, step `open-fav-dashboards-139`, run `20261104T214824Z-f674`, 2026-11-04T21:49:51.720Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.884:0`
- YP Metrics tour, step `open-fav-dashboards-139`, run `20261104T214824Z-f674`, 2026-11-04T21:49:51.720Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.886:0`
- YP Metrics tour, step `open-dashboard-english`, run `20261104T214824Z-f674`, 2026-11-04T21:53:04.811Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.994:0`
- YP Metrics tour, step `open-dashboard-english`, run `20261104T214824Z-f674`, 2026-11-04T21:53:05.841Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1004:0`
- YP Metrics tour, step `open-dashboard-english`, run `20261104T214824Z-f674`, 2026-11-04T21:53:05.842Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1006:0`
- and 5 more

### `GET /server/api/dash/pages/{pageId}/thumbnail`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `pageId` | path | literal | `139` | yes |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "properties": {
        "has_widgets_on_first_section": {
          "type": "boolean"
        },
        "id": {
          "type": "integer"
        },
        "thumbnail": {
          "properties": {
            "bytes": {
              "type": "integer"
            },
            "format": {
              "type": "string"
            },
            "height": {
              "type": "integer"
            },
            "public_id": {
              "type": "string"
            },
            "secure_url": {
              "format": "uri",
              "type": "string"
            },
            "url": {
              "format": "uri",
              "type": "string"
            },
            "width": {
              "type": "integer"
            }
          },
          "required": [
            "public_id",
            "secure_url",
            "url",
            "format",
            "bytes",
            "width",
            "height"
          ],
          "type": "object"
        }
      },
      "required": [
        "id",
        "thumbnail",
        "has_widgets_on_first_section"
      ],
      "type": "object"
    },
    "error": {
      "type": "boolean"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": {
    "has_widgets_on_first_section": true,
    "id": 139,
    "thumbnail": {
      "bytes": 238708,
      "format": "jpg",
      "height": 3256,
      "public_id": "instances/ypcanada/dashboard_thumbnails/ypcanadatapclickscom6ac54a442d700puppeteer_export_6ac54a43cf5a625eb2a71.jpg",
      "secure_url": "https://storage.googleapis.com/prod-client-cdnstaticassets-com/instances/ypcanada/dashboard_thumbnails/ypcanadatapclickscom6ac54a442d700puppeteer_export_6ac54a43cf5a625eb2a71.jpg",
      "url": "https://storage.googleapis.com/prod-client-cdnstaticassets-com/instances/ypcanada/dashboard_thumbnails/ypcanadatapclickscom6ac54a442d700puppeteer_export_6ac54a43cf5a625eb2a71.jpg",
      "width": 800
    }
  },
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (11)

- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 2x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 2x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 2x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 2x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 2x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 2x)
- `cookie adminhtml` comes from `POST /server/api/dashfiles/listusage` `set-cookie adminhtml` (seen 1x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 2x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 2x)
- `cookie adminhtml` comes from `GET /server/api/dash/pages/{pageId}/thumbnail` `set-cookie adminhtml` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/dash/pages/{pageId}/thumbnail` `cookie adminhtml`

**Observed in** (2)

- YP Metrics tour, step `open-dashboards`, run `20261104T214824Z-f674`, 2026-11-04T21:49:07.967Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.833:0`
- YP Metrics tour, step `open-dashboards`, run `20261104T214824Z-f674`, 2026-11-04T21:49:07.968Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.834:0`

### `GET /server/api/dash/widgets/{widgetId}/data`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `widgetId` | path | binding | `6793` | yes |
| `query_id` | query | computed | `63e52a73-9d59-40b5-8b8e-4993faca232f` | yes |
| `widget_request` | query | binding | `6793` | yes |
| `widget_type` | query | literal | `media` | yes |
| `widget_page_id` | query | literal | `92` | yes |
| `is_vue_dashboard` | query | literal | `true` | yes |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "type": "string"
    },
    "error": {
      "type": "boolean"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": "<p style=\"text-align: center; \"><span style=\"font-size: 24px;\"><b>Portfolio</b></span></p>",
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (80)

- `path widgetId` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[9]` (seen 3x)
- `query widget_request` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[9]` (seen 3x)
- `cookie ajs_user_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.userEmail` (seen 5x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 42x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 42x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 42x)
- `cookie ajs_group_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.instanceURL` (seen 5x)
- `cookie SimpleSAMLAuthToken` comes from `POST /simplesaml/module.php/saml/sp/saml2-acs.php/mymetrics_yp_ca_activedirectory_ypcanada` `set-cookie SimpleSAMLAuthToken` (seen 5x)
- `cookie adminhtml` comes from `GET /server/api/dash/pages/isleads/{isleadId}` `set-cookie adminhtml` (seen 4x)
- `path widgetId` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[12]` (seen 3x)
- `query widget_request` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[12]` (seen 3x)
- `cookie adminhtml` comes from `GET /server/api/dash/widgets/{widgetId}/data` `set-cookie adminhtml` (seen 9x)
- `path widgetId` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[10]` (seen 3x)
- `query widget_request` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[10]` (seen 3x)
- `cookie adminhtml` comes from `GET /server/api/categories/{categoryId}/data/{dataId}` `set-cookie adminhtml` (seen 18x)
- `path widgetId` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[28]` (seen 3x)
- `query widget_request` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[28]` (seen 3x)
- `path widgetId` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[24]` (seen 3x)
- `query widget_request` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[24]` (seen 3x)
- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 37x)
- and 60 more

**Observed in** (42)

- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:35.305Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.793:0`
- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:35.305Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.794:0`
- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:35.320Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.799:0`
- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:35.325Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.801:0`
- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:38.300Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.813:0`
- YP Metrics tour, step `open-fav-dashboards-92`, run `20261104T214824Z-f674`, 2026-11-04T21:49:30.154Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.856:0`
- YP Metrics tour, step `open-fav-dashboards-92`, run `20261104T214824Z-f674`, 2026-11-04T21:49:30.154Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.857:0`
- YP Metrics tour, step `open-fav-dashboards-92`, run `20261104T214824Z-f674`, 2026-11-04T21:49:30.168Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.861:0`
- YP Metrics tour, step `open-fav-dashboards-92`, run `20261104T214824Z-f674`, 2026-11-04T21:49:30.172Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.863:0`
- YP Metrics tour, step `open-fav-dashboards-92`, run `20261104T214824Z-f674`, 2026-11-04T21:49:33.156Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.870:0`
- YP Metrics tour, step `open-fav-dashboards-139`, run `20261104T214824Z-f674`, 2026-11-04T21:49:51.720Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.887:0`
- YP Metrics tour, step `open-fav-dashboards-139`, run `20261104T214824Z-f674`, 2026-11-04T21:49:51.721Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.888:0`
- and 30 more

### `GET /server/api/dash/{dashId}`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `dashId` | path | literal | `92` | yes |
| `all` | query | literal | `true` | yes |
| `single_layout_widgets_only` | query | literal | `true` | no |
| `include_executive_summary` | query | literal | `true` | no |
| `is_vue_dashboard` | query | literal | `true` | yes |
| `query_id` | query | computed | `a3fcc357-6513-4933-b7ac-a473d2a86ea2` | yes |
| `layout_id` | query | binding | `169` | no |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "properties": {
        "page": {
          "properties": {
            "can_be_accessed": {
              "type": "boolean"
            },
            "can_be_copied": {
              "type": "boolean"
            },
            "can_be_deleted": {
              "type": "boolean"
            },
            "can_be_deleted_tooltip": {
              "type": "null"
            },
            "can_be_edited": {
              "type": "boolean"
            },
            "can_be_listed": {
              "type": "boolean"
            },
            "can_favorite": {
              "type": "boolean"
            },
            "cluster": {
              "type": "null"
            },
            "cluster_id": {
              "type": "null"
            },
            "created_at": {
              "type": "integer"
            },
            "data_sources": {
              "items": {
                "properties": {
                  "data_source_id": {
                    "type": "string"
                  },
                  "data_type": {
                    "type": "string"
                  },
                  "data_view_id": {
                    "type": [
                      "string",
                      "null"
                    ]
                  }
                },
                "required": [
                  "data_source_id",
                  "data_type",
                  "data_view_id"
                ],
                "type": "object"
              },
              "type": "array"
            },
            "display_order": {
              "type": "integer"
            },
            "entity": {
              "type": "null"
            },
            "entity_display": {
              "type": "null"
            },
            "executive_summary_enabled": {
              "type": "boolean"
            },
            "folder_id": {
              "type": "null"
            },
            "folder_name": {
              "type": "null"
            },
            "formatted_created_at": {
              "type": "string"
            },
            "formatted_updated_at": {
              "type": "string"
            },
            "global_filter_ids": {
              "type": "array"
            },
            "granular_access_levels": {
              "properties": {
                "can_be_edited": {
                  "type": "boolean"
                }
              },
              "required": [
                "can_be_edited"
              ],
              "type": "object"
            },
            "has_granular_permissions": {
              "type": "boolean"
            },
            "has_widgets_on_first_section": {
              "type": "boolean"
            },
            "icon": {
              "type": "string"
            },
            "icon_bg_color": {
              "type": "string"
            },
            "id": {
              "type": "string"
            },
            "is_dynamic": {
              "type": "boolean"
            },
            "is_favorite": {
              "type": "boolean"
            },
            "is_in_library": {
              "type": "boolean"
            },
            "is_locked": {
              "type": "boolean"
            },
            "is_predefined": {
              "type": "boolean"
            },
            "is_template": {
              "type": "boolean"
            },
            "layouts": {
              "additionalProperties": {
                "properties": {
                  "created_at": {
                    "type": "integer"
                  },
                  "display_order": {
                    "type": "integer"
                  },
                  "formatted_created_at": {
                    "type": "string"
                  },
                  "formatted_updated_at": {
                    "type": "string"
                  },
                  "id": {
                    "type": "string"
                  },
                  "is_in_library": {
                    "type": "boolean"
                  },
                  "is_predefined": {
                    "type": "boolean"
                  },
                  "metadata": {
                    "properties": {
                      "custom_icon": {
                        "type": "null"
                      },
                      "custom_icon_color": {
                        "type": "null"
                      },
                      "data_source": {
                        "anyOf": [
                          {
                            "items": {
                              "properties": {
                                "color": {
                                  "type": "string"
                                },
                                "data_view": {
                                  "type": "integer"
                                },
                                "data_view_name": {
                                  "type": "null"
                                },
                                "has_custom_icon": {
                                  "type": "null"
                                },
                                "has_live_integration": {
                                  "type": "boolean"
                                },
                                "icon": {
                                  "type": "string"
                                },
                                "id": {
                                  "type": "string"
                                },
                                "id_name": {
                                  "type": "string"
                                },
                                "include_data_freshness_date": {
                                  "type": "null"
                                },
                                "include_num_entities": {
                                  "type": "null"
                                },
                                "is_custom_service": {
                                  "type": "null"
                                },
                                "is_of_type_service": {
                                  "type": "boolean"
                                },
                                "name": {
                                  "type": "string"
                                },
                                "primary_date_field": {
                                  "type": "string"
                                },
                                "requires_date_range": {
                                  "type": "boolean"
                                },
                                "requires_group_by": {
                                  "type": "boolean"
                                },
                                "type": {
                                  "type": "string"
                                }
                              },
                              "required": [
                                "type",
                                "id",
                                "data_view",
                                "name",
                                "id_name",
                                "data_view_name",
                                "icon",
                                "has_custom_icon",
                                "color",
                                "requires_group_by",
                                "requires_date_range",
                                "is_of_type_service",
                                "include_num_entities",
                                "include_data_freshness_date",
                                "is_custom_service",
                                "has_live_integration",
                                "primary_date_field"
                              ],
                              "type": "object"
                            },
                            "type": "array"
                          },
                          {
                            "properties": {
                              "active": {
                                "type": "boolean"
                              },
                              "color": {
                                "type": "string"
                              },
                              "data_view": {
                                "type": "null"
                              },
                              "data_view_name": {
                                "type": "null"
                              },
                              "geo_columns": {
                                "type": "null"
                              },
                              "has_custom_icon": {
                                "type": "boolean"
                              },
                              "has_live_integration": {
                                "type": "boolean"
                              },
                              "has_stored_data": {
                                "type": "boolean"
                              },
                              "icon": {
                                "type": "string"
                              },
                              "id": {
                                "type": "string"
                              },
                              "id_name": {
                                "type": "string"
                              },
                              "include_data_freshness_date": {
                                "type": "null"
                              },
                              "include_num_entities": {
                                "type": "null"
                              },
                              "is_custom_service": {
                                "type": "boolean"
                              },
                              "is_of_type_service": {
                                "type": "boolean"
                              },
                              "live_assignments_threshold": {
                                "type": "null"
                              },
                              "mapbox_config": {
                                "type": "array"
                              },
                              "name": {
                                "type": "string"
                              },
                              "primary_date_field": {
                                "type": "string"
                              },
                              "requires_date_range": {
                                "type": "boolean"
                              },
                              "requires_group_by": {
                                "type": "boolean"
                              },
                              "type": {
                                "type": "string"
                              }
                            },
                            "required": [
                              "type",
                              "id",
                              "data_view",
                              "name",
                              "id_name",
                              "data_view_name",
                              "icon",
                              "has_custom_icon",
                              "color",
                              "requires_group_by",
                              "requires_date_range",
                              "is_of_type_service",
                              "include_num_entities",
                              "include_data_freshness_date",
                              "is_custom_service",
                              "has_live_integration",
                              "primary_date_field",
                              "geo_columns",
                              "mapbox_config",
                              "active",
                              "live_assignments_threshold",
                              "has_stored_data"
                            ],
                            "type": "object"
                          }
                        ]
                      },
                      "description": {
                        "type": [
                          "string",
                          "null"
                        ]
                      },
                      "draw_options": {
                        "properties": {
                          "show_background": {
                            "properties": {
                              "metadata": {
                                "type": "object"
                              },
                              "overridden": {
                                "type": "boolean"
                              },
                              "value": {
                                "type": "boolean"
                              }
                            },
                            "required": [
                              "value",
                              "overridden",
                              "metadata"
                            ],
                            "type": "object"
                          },
                          "show_borders": {
                            "properties": {
                              "metadata": {
                                "type": "object"
                              },
                              "overridden": {
                                "type": "boolean"
                              },
                              "value": {
                                "type": "boolean"
                              }
                            },
                            "required": [
                              "value",
                              "overridden",
                              "metadata"
                            ],
                            "type": "object"
                          },
                          "show_data_source": {
                            "properties": {
                              "metadata": {
                                "type": "array"
                              },
                              "overridden": {
                                "type": "boolean"
                              },
                              "value": {
                                "type": "boolean"
                              }
                            },
                            "required": [
                              "value",
                              "overridden",
                              "metadata"
                            ],
                            "type": "object"
                          },
                          "show_header": {
                            "properties": {
                              "metadata": {
                                "type": "object"
                              },
                              "overridden": {
                                "type": "boolean"
                              },
                              "value": {
                                "type": "boolean"
                              }
                            },
                            "required": [
                              "value",
                              "overridden",
                              "metadata"
                            ],
                            "type": "object"
                          },
                          "show_metric_name": {
                            "properties": {
                              "metadata": {
                                "type": "object"
                              },
                              "overridden": {
                                "type": "boolean"
                              },
                              "value": {
                                "type": "boolean"
                              }
                            },
                            "required": [
                              "value",
                              "overridden",
                              "metadata"
                            ],
                            "type": "object"
                          },
                          "show_on_demand_badge": {
                            "properties": {
                              "metadata": {
                                "type": "object"
                              },
                              "overridden": {
                                "type": "boolean"
                              },
                              "value": {
                                "type": "boolean"
                              }
                            },
                            "required": [
                              "value",
                              "overridden",
                              "metadata"
                            ],
                            "type": "object"
                          },
                          "show_shadow": {
                            "properties": {
                              "metadata": {
                                "type": "object"
                              },
                              "overridden": {
                                "type": "boolean"
                              },
                              "value": {
                                "type": "boolean"
                              }
                            },
                            "required": [
                              "value",
                              "overridden",
                              "metadata"
                            ],
                            "type": "object"
                          },
                          "show_title": {
                            "properties": {
                              "metadata": {
                                "type": "array"
                              },
                              "overridden": {
                                "type": "boolean"
                              },
                              "value": {
                                "type": "boolean"
                              }
                            },
                            "required": [
                              "value",
                              "overridden",
                              "metadata"
                            ],
                            "type": "object"
                          },
                          "show_widgets_with_no_data": {
                            "properties": {
                              "metadata": {
                                "type": "array"
                              },
                              "overridden": {
                                "type": "boolean"
                              },
                              "value": {
                                "type": "boolean"
                              }
                            },
                            "required": [
                              "value",
                              "overridden",
                              "metadata"
                            ],
                            "type": "object"
                          }
                        },
                        "required": [
                          "show_shadow",
                          "show_background",
                          "show_borders",
                          "show_title",
                          "show_data_source",
                          "show_widgets_with_no_data",
                          "show_header",
                          "show_on_demand_badge",
                          "show_metric_name"
                        ],
                        "type": "object"
                      },
                      "export_options": {
                        "properties": {
                          "draw_options": {
                            "properties": {
                              "show_borders": {
                                "type": "object"
                              },
                              "show_data_source": {
                                "type": "object"
                              },
                              "show_header": {
                                "type": "object"
                              },
                              "show_metric_name": {
                                "type": "object"
                              },
                              "show_on_demand_badge": {
                                "type": "object"
                              },
                              "show_page_footer": {
                                "type": "boolean"
                              },
                              "show_page_header": {
                                "type": "boolean"
                              },
                              "show_title": {
                                "type": "object"
                              }
                            },
                            "required": [
                              "show_borders",
                              "show_header",
                              "show_title",
                              "show_data_source",
                              "show_on_demand_badge",
                              "show_metric_name",
                              "show_page_header",
                              "show_page_footer"
                            ],
                            "type": "object"
                          },
                          "orientation": {
                            "type": "string"
                          }
                        },
                        "required": [
                          "orientation",
                          "draw_options"
                        ],
                        "type": "object"
                      },
                      "icon_mode": {
                        "type": "string"
                      },
                      "is_packed": {
                        "type": "boolean"
                      },
                      "selected_entity": {
                        "type": "array"
                      },
                      "tags": {
                        "type": "array"
                      },
                      "thumbnail_metadata": {
                        "properties": {
                          "bytes": {
                            "type": "integer"
                          },
                          "format": {
                            "type": "string"
                          },
                          "height": {
                            "type": "integer"
                          },
                          "public_id": {
                            "type": "string"
                          },
                          "secure_url": {
                            "format": "uri",
                            "type": "string"
                          },
                          "url": {
                            "format": "uri",
                            "type": "string"
                          },
                          "width": {
                            "type": "integer"
                          }
                        },
                        "required": [
                          "public_id",
                          "secure_url",
                          "url",
                          "format",
                          "bytes",
                          "width",
                          "height"
                        ],
                        "type": "object"
                      }
                    },
                    "required": [
                      "data_source",
                      "description",
                      "draw_options",
                      "is_packed",
                      "selected_entity",
                      "tags",
                      "thumbnail_metadata",
                      "icon_mode",
                      "custom_icon",
                      "custom_icon_color",
                      "export_options"
                    ],
                    "type": "object"
                  },
                  "page_id": {
                    "type": "string"
                  },
                  "timegroup": {
                    "type": "string"
                  },
                  "title": {
                    "type": "string"
                  },
                  "unique_id": {
                    "type": "null"
                  },
                  "updated_at": {
                    "type": "integer"
                  },
                  "widgets": {
                    "anyOf": [
                      {
                        "additionalProperties": {
                          "properties": {
                            "assignments": {
                              "type": "null"
                            },
                            "can_be_accessed": {
                              "type": "boolean"
                            },
                            "can_be_copied": {
                              "type": "boolean"
                            },
                            "can_be_deleted": {
                              "type": "boolean"
                            },
                            "can_be_deleted_tooltip": {
                              "type": "null"
                            },
                            "can_be_edited": {
                              "type": "boolean"
                            },
                            "created_at": {
                              "type": "integer"
                            },
                            "created_from_library": {
                              "type": "boolean"
                            },
                            "data_source_id": {
                              "type": [
                                "string",
                                "null"
                              ]
                            },
                            "data_type": {
                              "type": [
                                "string",
                                "null"
                              ]
                            },
                            "data_view_id": {
                              "type": [
                                "string",
                                "null"
                              ]
                            },
                            "display_order": {
                              "type": "integer"
                            },
                            "formatted_created_at": {
                              "type": "string"
                            },
                            "formatted_updated_at": {
                              "type": "string"
                            },
                            "has_live_integration": {
                              "type": "boolean"
                            },
                            "height": {
                              "type": "integer"
                            },
                            "id": {
                              "type": "string"
                            },
                            "is_in_library": {
                              "type": "boolean"
                            },
                            "is_predefined": {
                              "type": "boolean"
                            },
                            "is_using_calculation": {
                              "type": "boolean"
                            },
                            "layout_id": {
                              "type": "string"
                            },
                            "library_download_count": {
                              "type": "integer"
                            },
                            "metadata": {
                              "properties": {
                                "benchmark": {
                                  "type": "array"
                                },
                                "bullets_per_benchmark": {
                                  "type": "array"
                                },
                                "bullets_per_column": {
                                  "type": "array"
                                },
                                "bullets_per_instance_benchmark": {
                                  "type": "array"
                                },
                                "chart_palette": {
                                  "type": [
                                    "array",
                                    "null"
                                  ]
                                },
                                "compare_to_prior_period": {
                                  "type": "boolean"
                                },
                                "comparison_end_date_override": {
                                  "type": "null"
                                },
                                "comparison_good_override": {
                                  "type": "array"
                                },
                                "comparison_option": {
                                  "type": "string"
                                },
                                "comparison_overwrite": {
                                  "type": "array"
                                },
                                "comparison_relative_date_range": {
                                  "type": "string"
                                },
                                "comparison_start_date_override": {
                                  "type": "null"
                                },
                                "comparison_type": {
                                  "type": "string"
                                },
                                "comparison_type_display": {
                                  "type": "string"
                                },
                                "content": {
                                  "type": "null"
                                },
                                "cumulative_columns": {
                                  "type": "array"
                                },
                                "currency_discrepancy": {
                                  "type": "boolean"
                                },
                                "data_columns": {
                                  "type": "object"
                                },
                                "data_source": {
                                  "type": [
                                    "object",
                                    "null"
                                  ]
                                },
                                "data_source_display": {
                                  "type": "null"
                                },
                                "description": {
                                  "type": "null"
                                },
                                "draw_options": {
                                  "type": "object"
                                },
                                "dynamic": {
                                  "type": "object"
                                },
                                "end_date_override": {
                                  "type": "null"
                                },
                                "entity": {
                                  "type": "object"
                                },
                                "export_options": {
                                  "type": "null"
                                },
                                "fields_to_embed_sparklines": {
                                  "type": "array"
                                },
                                "filter_set_id": {
                                  "type": [
                                    "string",
                                    "null"
                                  ]
                                },
                                "geo_code": {
                                  "type": "null"
                                },
                                "has_data_discrepancy": {
                                  "type": "boolean"
                                },
                                "heatmap_gradient": {
                                  "type": "array"
                                },
                                "id": {
                                  "type": [
                                    "string",
                                    "null"
                                  ]
                                },
                                "ignore_date_range": {
                                  "type": "boolean"
                                },
                                "instance_benchmark": {
                                  "type": "array"
                                },
                                "is_from_preview_layout": {
                                  "type": "boolean"
                                },
                                "is_header": {
                                  "type": "boolean"
                                },
                                "is_multi_grouped": {
                                  "type": "boolean"
                                },
                                "is_overriding_date_range": {
                                  "type": "boolean"
                                },
                                "is_predefined": {
                                  "type": "boolean"
                                },
                                "keep_content": {
                                  "type": "boolean"
                                },
                                "line_columns": {
                                  "anyOf": [
                                    {
                                      "type": "array"
                                    },
                                    {
                                      "type": "object"
                                    }
                                  ]
                                },
                                "live_formula_fields": {
                                  "type": "array"
                                },
                                "live_formulas": {
                                  "type": "array"
                                },
                                "load_all_data": {
                                  "type": "boolean"
                                },
                                "map_id": {
                                  "type": "null"
                                },
                                "map_zoom": {
                                  "type": [
                                    "array",
                                    "null"
                                  ]
                                },
                                "max_font_size": {
                                  "type": "integer"
                                },
                                "min_font_size": {
                                  "type": "integer"
                                },
                                "move_y_axes": {
                                  "anyOf": [
                                    {
                                      "type": "object"
                                    },
                                    {
                                      "type": "array"
                                    }
                                  ]
                                },
                                "offset": {
                                  "type": "integer"
                                },
                                "product_widget_can_be_accessed": {
                                  "type": "boolean"
                                },
                                "relative_date_range": {
                                  "type": "string"
                                },
                                "rounded_metrics": {
                                  "type": "array"
                                },
                                "show_currency": {
                                  "type": "boolean"
                                },
                                "show_overflow_message": {
                                  "type": "boolean"
                                },
                                "sort_by": {
                                  "type": [
                                    "array",
                                    "null"
                                  ]
                                },
                                "sort_order": {
                                  "anyOf": [
                                    {
                                      "type": "array"
                                    },
                                    {
                                      "type": "boolean"
                                    }
                                  ]
                                },
                                "sparkline_option": {
                                  "type": "string"
                                },
                                "start_date_override": {
                                  "type": "null"
                                },
                                "tags": {
                                  "type": "array"
                                },
                                "thumbnail_metadata": {
                                  "type": "null"
                                },
                                "time_grouping": {
                                  "type": [
                                    "string",
                                    "null"
                                  ]
                                },
                                "time_grouping_display": {
                                  "type": [
                                    "string",
                                    "null"
                                  ]
                                },
                                "type": {
                                  "type": "string"
                                },
                                "user_conditional_columns": {
                                  "type": "array"
                                },
                                "user_grouped_columns": {
                                  "type": "array"
                                },
                                "weekly_start_day": {
                                  "type": "string"
                                },
                                "weekly_start_day_display": {
                                  "type": "string"
                                },
                                "widget_products": {
                                  "type": "array"
                                }
                              },
                              "required": [
                                "draw_options",
                                "sort_by",
                                "tags",
                                "description",
                                "export_options",
                                "thumbnail_metadata",
                                "data_source",
                                "dynamic"
                              ],
                              "type": "object"
                            },
                            "report_id": {
                              "type": "null"
                            },
                            "timegroup": {
                              "type": "string"
                            },
                            "title": {
                              "type": "string"
                            },
                            "type": {
                              "type": "string"
                            },
                            "type_display": {
                              "type": "string"
                            },
                            "unique_id": {
                              "type": "null"
                            },
                            "updated_at": {
                              "type": "integer"
                            },
                            "width": {
                              "type": "integer"
                            }
                          },
                          "required": [
                            "id",
                            "unique_id",
                            "layout_id",
                            "report_id",
                            "type",
                            "width",
                            "height",
                            "display_order",
                            "title",
                            "is_predefined",
                            "is_in_library",
                            "created_from_library",
                            "metadata",
                            "created_at",
                            "updated_at",
                            "library_download_count",
                            "data_type",
                            "data_source_id",
                            "data_view_id",
                            "has_live_integration",
                            "is_using_calculation",
                            "assignments",
                            "type_display",
                            "timegroup",
                            "formatted_updated_at",
                            "formatted_created_at",
                            "can_be_accessed",
                            "can_be_edited",
                            "can_be_deleted",
                            "can_be_copied",
                            "can_be_deleted_tooltip"
                          ],
                          "type": "object"
                        },
                        "type": "object"
                      },
                      {
                        "type": "array"
                      }
                    ]
                  }
                },
                "required": [
                  "id",
                  "unique_id",
                  "page_id",
                  "display_order",
                  "is_predefined",
                  "is_in_library",
                  "title",
                  "metadata",
                  "created_at",
                  "updated_at",
                  "timegroup",
                  "formatted_created_at",
                  "formatted_updated_at",
                  "widgets"
                ],
                "type": "object"
              },
              "type": "object"
            },
            "metadata": {
              "properties": {
                "append_exported_datagrids": {
                  "type": "boolean"
                },
                "append_exported_datagrids_to_layout": {
                  "type": "boolean"
                },
                "chart_palette": {
                  "items": {
                    "type": "string"
                  },
                  "type": "array"
                },
                "client_naics_code": {
                  "type": "null"
                },
                "client_naics_title": {
                  "type": "null"
                },
                "created_from": {
                  "type": "string"
                },
                "dashboard_filters": {
                  "type": "null"
                },
                "datagrid_with_fixed_header_size": {
                  "type": "boolean"
                },
                "description": {
                  "type": "null"
                },
                "disable_comparison": {
                  "type": "boolean"
                },
                "disable_dash_filters": {
                  "type": "boolean"
                },
                "font_size": {
                  "type": "string"
                },
                "groupedClientIds": {
                  "type": "null"
                },
                "hide_empty_exported_widgets": {
                  "type": "boolean"
                },
                "include_summary_page": {
                  "type": "boolean"
                },
                "requires_refresh_on_date_range_change": {
                  "type": "boolean"
                },
                "selected_entity": {
                  "type": "null"
                },
                "tags": {
                  "type": "array"
                }
              },
              "required": [
                "selected_entity",
                "chart_palette",
                "font_size",
                "append_exported_datagrids",
                "append_exported_datagrids_to_layout",
                "hide_empty_exported_widgets",
                "description",
                "dashboard_filters",
                "disable_dash_filters",
                "disable_comparison",
                "tags",
                "requires_refresh_on_date_range_change",
                "include_summary_page",
                "created_from",
                "datagrid_with_fixed_header_size",
                "client_naics_code",
                "client_naics_title",
                "groupedClientIds"
              ],
              "type": "object"
            },
            "module": {
              "type": "null"
            },
            "reporting_profiles": {
              "items": {
                "properties": {
                  "id": {
                    "type": "string"
                  },
                  "name": {
                    "type": "string"
                  }
                },
                "required": [
                  "id",
                  "name"
                ],
                "type": "object"
              },
              "type": "array"
            },
            "show_benchmark_warning": {
              "type": "boolean"
            },
            "timegroup": {
              "type": "string"
            },
            "title": {
              "type": "string"
            },
            "type": {
              "type": "string"
            },
            "type_display": {
              "type": "string"
            },
            "unique_id": {
              "type": "null"
            },
            "updated_at": {
              "type": "integer"
            },
            "widget_data_warehouse_types": {
              "type": "string"
            },
            "widget_data_warehouse_types_display": {
              "type": "string"
            },
            "widget_ids": {
              "items": {
                "type": "string"
              },
              "type": "array"
            }
          },
          "required": [
            "id",
            "unique_id",
            "display_order",
            "title",
            "is_predefined",
            "is_template",
            "is_in_library",
            "type",
            "module",
            "entity",
            "icon",
            "icon_bg_color",
            "metadata",
            "created_at",
            "updated_at",
            "executive_summary_enabled",
            "is_favorite",
            "reporting_profiles",
            "cluster_id",
            "cluster",
            "widget_ids",
            "data_sources",
            "widget_data_warehouse_types",
            "folder_id",
            "folder_name",
            "is_locked",
            "timegroup",
            "formatted_updated_at",
            "global_filter_ids",
            "has_widgets_on_first_section",
            "formatted_created_at",
            "entity_display",
            "type_display",
            "can_favorite",
            "widget_data_warehouse_types_display",
            "is_dynamic",
            "has_granular_permissions",
            "granular_access_levels",
            "can_be_accessed",
            "can_be_edited",
            "can_be_deleted",
            "can_be_copied",
            "can_be_deleted_tooltip",
            "can_be_listed",
            "layouts",
            "show_benchmark_warning"
          ],
          "type": "object"
        }
      },
      "required": [
        "page"
      ],
      "type": "object"
    },
    "error": {
      "type": "boolean"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": {
    "page": {
      "can_be_accessed": true,
      "can_be_copied": false,
      "can_be_deleted": false,
      "can_be_deleted_tooltip": null,
      "can_be_edited": false,
      "can_be_listed": true,
      "can_favorite": false,
      "cluster": null,
      "cluster_id": null,
      "created_at": 1774035195,
      "data_sources": [
        {
          "data_source_id": "1000016",
          "data_type": "service_data",
          "data_view_id": "cgn"
        },
        {
          "data_source_id": "1000016",
          "data_type": "service_data",
          "data_view_id": null
        }
      ],
      "display_order": 7,
      "entity": null,
      "entity_display": null,
      "executive_summary_enabled": false,
      "folder_id": null,
      "folder_name": null,
      "formatted_created_at": "Mar 20, 2026 3:33 PM",
      "formatted_updated_at": "Nov 04, 2026 11:50 AM",
      "global_filter_ids": [],
      "granular_access_levels": {
        "can_be_edited": false
      },
      "has_granular_permissions": false,
      "has_widgets_on_first_section": true,
      "icon": "icomoon-gaugechart",
      "icon_bg_color": "transparent",
      "id": "92",
      "is_dynamic": false,
      "is_favorite": true,
      "is_in_library": false,
      "is_locked": false,
      "is_predefined": false,
      "is_template": false,
      "layouts": {
        "{key}": {
          "created_at": 0,
          "display_order": 4,
          "formatted_created_at": "{redacted}",
          "formatted_updated_at": "{redacted}",
          "id": "{redacted}",
          "is_in_library": false,
          "is_predefined": false,
          "metadata": {
            "custom_icon": null,
            "custom_icon_color": null,
            "data_source": [
              {
                "color": "{redacted}",
                "data_view": 0,
                "data_view_name": null,
                "has_custom_icon": null,
                "has_live_integration": false,
                "icon": "{redacted}",
                "id": "{redacted}",
                "id_name": "{redacted}",
                "include_data_freshness_date": null,
                "include_num_entities": null,
                "is_custom_service": null,
                "is_of_type_service": false,
                "name": "{redacted}",
                "primary_date_field": "{redacted}",
                "requires_date_range": false,
                "requires_group_by": false,
                "type": "{redacted}"
              },
              {
                "color": "{redacted}",
                "data_view": 0,
                "data_view_name": null,
                "has_custom_icon": null,
                "has_live_integration": false,
                "icon": "{redacted}",
                "id": "{redacted}",
                "id_name": "{redacted}",
                "include_data_freshness_date": null,
                "include_num_entities": null,
                "is_custom_service": null,
                "is_of_type_service": false,
                "name": "{redacted}",
                "primary_date_field": "{redacted}",
                "requires_date_range": false,
                "requires_group_by": false,
                "type": "{redacted}"
              }
            ],
            "description": null,
            "draw_options": {
              "show_background": {
                "metadata": {
                  "color": "{redacted}"
                },
                "overridden": false,
                "value": true
              },
              "show_borders": {
                "metadata": {
                  "color": "{redacted}",
                  "radius": 10,
                  "size": 1,
                  "style": "{redacted}"
                },
                "overridden": false,
                "value": true
              },
              "show_data_source": {
                "metadata": [],
                "overridden": false,
                "value": false
              },
              "show_header": {
                "metadata": {},
                "overridden": false,
                "value": true
              },
              "show_metric_name": {
                "metadata": {},
                "overridden": false,
                "value": true
              },
              "show_on_demand_badge": {
                "metadata": {},
                "overridden": false,
                "value": true
              },
              "show_shadow": {
                "metadata": {
                  "blur": 5,
                  "color": "{redacted}",
                  "x": 0,
                  "y": 3
                },
                "overridden": false,
                "value": false
              },
              "show_title": {
                "metadata": [],
                "overridden": false,
                "value": true
              },
              "show_widgets_with_no_data": {
                "metadata": [],
                "overridden": true,
                "value": false
              }
            },
            "export_options": {
              "draw_options": {
                "show_borders": {
                  "metadata": {},
                  "overridden": false,
                  "value": true
                },
                "show_data_source": {
                  "metadata": {},
                  "overridden": false,
                  "value": true
                },
                "show_header": {
                  "metadata": {},
                  "overridden": false,
                  "value": true
                },
                "show_metric_name": {
                  "metadata": {},
                  "overridden": false,
                  "value": true
                },
                "show_on_demand_badge": {
                  "metadata": {},
                  "overridden": false,
                  "value": true
                },
                "show_page_footer": false,
                "show_page_header": false,
                "show_title": {
                  "metadata": {},
                  "overridden": false,
                  "value": true
                }
              },
              "orientation": "{redacted}"
            },
            "icon_mode": "{redacted}",
            "is_packed": true,
            "selected_entity": [],
            "tags": [],
            "thumbnail_metadata": {
              "bytes": 48783,
              "format": "{redacted}",
              "height": 1185,
              "public_id": "{redacted}",
              "secure_url": "{redacted}",
              "url": "{redacted}",
              "width": 800
            }
          },
          "page_id": "{redacted}",
          "timegroup": "{redacted}",
          "title": "{redacted}",
          "unique_id": null,
          "updated_at": 1793670436,
          "widgets": {
            "{key}": {
              "assignments": null,
              "can_be_accessed": true,
              "can_be_copied": false,
              "can_be_deleted": false,
              "can_be_deleted_tooltip": null,
              "can_be_edited": false,
              "created_at": 1552905739,
              "created_from_library": false,
              "data_source_id": "{redacted}",
              "data_type": "{redacted}",
              "data_view_id": null,
              "display_order": 1,
              "formatted_created_at": "{redacted}",
              "formatted_updated_at": "{redacted}",
              "has_live_integration": false,
              "height": 1,
              "id": "{redacted}",
              "is_in_library": false,
              "is_predefined": false,
              "is_using_calculation": false,
              "layout_id": "{redacted}",
              "library_download_count": 0,
              "metadata": {
                "chart_palette": null,
                "content": null,
                "data_source": {
                  "active": true,
                  "color": "{redacted}",
                  "data_view": null,
                  "data_view_name": null,
                  "geo_columns": null,
                  "has_custom_icon": true,
                  "has_live_integration": false,
                  "has_stored_data": true,
                  "icon": "{redacted}",
                  "id": "{redacted}",
                  "id_name": "{redacted}",
                  "include_data_freshness_date": null,
                  "include_num_entities": null,
                  "is_custom_service": true,
                  "is_of_type_service": true,
                  "live_assignments_threshold": null,
                  "mapbox_config": [],
                  "name": "{redacted}",
                  "primary_date_field": "{redacted}",
                  "requires_date_range": true,
                  "requires_group_by": true,
                  "type": "{redacted}"
                },
                "description": null,
                "draw_options": {
                  "force_sample_data": false,
                  "show_background": {
                    "overridden": false,
                    "value": true
                  },
                  "show_borders": {
                    "overridden": false,
                    "value": true
                  },
                  "show_data_source": {
                    "overridden": false,
                    "value": true
                  },
                  "show_header": {
                    "overridden": false,
                    "value": true
                  },
                  "show_title": {
                    "overridden": false,
                    "value": true
                  },
                  "show_widgets_with_no_data": {
                    "overridden": false,
                    "value": true
                  }
                },
                "dynamic": {
                  "alerts": [],
                  "annotations": [],
                  "errors": [],
                  "filter_set_name": null,
                  "filters": [],
                  "is_inactive": false,
                  "is_item_not_found": false,
                  "predefined_data": null,
                  "predefined_filters": null,
                  "raw_data": null,
                  "warnings": []
                },
                "entity": {
                  "color": "{redacted}",
                  "data_view": null,
                  "data_view_name": null,
                  "has_custom_icon": true,
                  "icon": "{redacted}",
                  "id": "{redacted}",
                  "id_name": "{redacted}",
                  "include_data_freshness_date": false,
                  "include_num_entities": false,
                  "is_custom_service": true,
                  "is_of_type_service": true,
                  "name": null,
                  "requires_date_range": false,
                  "requires_group_by": false,
                  "type": "{redacted}"
                },
                "export_options": null,
                "is_header": false,
                "keep_content": false,
                "sort_by": null,
                "tags": [],
                "thumbnail_metadata": null
              },
              "report_id": null,
              "timegroup": "{redacted}",
              "title": "{redacted}",
              "type": "{redacted}",
              "type_display": "{redacted}",
              "unique_id": null,
              "updated_at": 1764689453,
              "width": 6
            }
          }
        }
      },
      "metadata": {
        "append_exported_datagrids": true,
        "append_exported_datagrids_to_layout": false,
        "chart_palette": [
          "#1E9AD6",
          "#EE4036"
        ],
        "client_naics_code": null,
        "client_naics_title": null,
        "created_from": "",
        "dashboard_filters": null,
        "datagrid_with_fixed_header_size": true,
        "description": null,
        "disable_comparison": false,
        "disable_dash_filters": false,
        "font_size": "small",
        "groupedClientIds": null,
        "hide_empty_exported_widgets": false,
        "include_summary_page": false,
        "requires_refresh_on_date_range_change": true,
        "selected_entity": null,
        "tags": []
      },
      "module": null,
      "reporting_profiles": [
        {
          "id": "1",
          "name": "Default Profile"
        },
        {
          "id": "3",
          "name": "Default Profile - English"
        }
      ],
      "show_benchmark_warning": false,
      "timegroup": "hourly",
      "title": "YP Metrics - English",
      "type": "dash",
      "type_display": "Dashboards",
      "unique_id": null,
      "updated_at": 1793811051,
      "widget_data_warehouse_types": "Data Warehouse",
      "widget_data_warehouse_types_display": "Data Warehouse",
      "widget_ids": [
        "6763",
        "6766"
      ]
    }
  },
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (333)

- `cookie ajs_user_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.userEmail` (seen 2x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 20x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 20x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 20x)
- `cookie ajs_group_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.instanceURL` (seen 2x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 19x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 19x)
- `cookie SimpleSAMLAuthToken` comes from `POST /simplesaml/module.php/saml/sp/saml2-acs.php/mymetrics_yp_ca_activedirectory_ypcanada` `set-cookie SimpleSAMLAuthToken` (seen 2x)
- `cookie adminhtml` comes from `GET /server/api/dash/pages/isleads/{isleadId}` `set-cookie adminhtml` (seen 13x)
- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 18x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 18x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 18x)
- `cookie adminhtml` comes from `storage` `storage cookie[adminhtml]` (seen 5x)
- `query layout_id` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.2267.id` (seen 1x)
- `query layout_id` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.1592.id` (seen 3x)
- `cookie adminhtml` comes from `POST /server/api/daterange` `set-cookie adminhtml` (seen 2x)
- `response.body $.data.page.widget_ids[44]` feeds `GET /server/api/categories/{categoryId}/data/{dataId}` `query widget_request`
- `response.body $.data.page.layouts.125.widgets.10561.type` feeds `GET /server/api/categories/{categoryId}/data/{dataId}` `query widget_type`
- `response.body $.data.page.widget_ids[216]` feeds `GET /server/api/categories/{categoryId}/data/{dataId}` `query widget_request`
- `response.body $.data.page.layouts.125.widgets.82740.type` feeds `GET /server/api/categories/{categoryId}/data/{dataId}` `query widget_type`
- and 313 more

**Observed in** (20)

- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:33.736Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.713:0`
- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:35.304Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.791:0`
- YP Metrics tour, step `open-fav-dashboards-92`, run `20261104T214824Z-f674`, 2026-11-04T21:49:29.281Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.843:0`
- YP Metrics tour, step `open-fav-dashboards-92`, run `20261104T214824Z-f674`, 2026-11-04T21:49:30.153Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.854:0`
- YP Metrics tour, step `open-fav-dashboards-139`, run `20261104T214824Z-f674`, 2026-11-04T21:49:50.859Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.877:0`
- YP Metrics tour, step `open-fav-dashboards-139`, run `20261104T214824Z-f674`, 2026-11-04T21:49:51.720Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.885:0`
- YP Metrics tour, step `open-dashboard-english`, run `20261104T214824Z-f674`, 2026-11-04T21:53:04.811Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.995:0`
- YP Metrics tour, step `open-dashboard-english`, run `20261104T214824Z-f674`, 2026-11-04T21:53:05.842Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1005:0`
- YP Metrics tour, step `tab-yp-network`, run `20261104T214824Z-f674`, 2026-11-04T21:53:48.027Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1029:0`
- YP Metrics tour, step `tab-yp-network`, run `20261104T214824Z-f674`, 2026-11-04T21:53:48.028Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1031:0`
- YP Metrics tour, step `tab-website`, run `20261104T214824Z-f674`, 2026-11-04T21:54:09.674Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1077:0`
- YP Metrics tour, step `tab-website`, run `20261104T214824Z-f674`, 2026-11-04T21:54:09.675Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1079:0`
- and 8 more

### `POST /server/api/dashfiles/listusage`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

**Request**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "model": {
      "type": "string"
    }
  },
  "required": [
    "model"
  ],
  "type": "object"
}
```

Example:

```json
{
  "model": "{\"ids\":[\"139\",\"92\"]}"
}
```

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "items": {
        "properties": {
          "can_be_deleted_tooltip": {
            "type": "string"
          },
          "id": {
            "type": "string"
          },
          "in_use": {
            "type": "boolean"
          }
        },
        "required": [
          "id",
          "in_use",
          "can_be_deleted_tooltip"
        ],
        "type": "object"
      },
      "type": "array"
    },
    "error": {
      "type": "boolean"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": [
    {
      "can_be_deleted_tooltip": "This dashboard is used in at least one scheduled report, click on the relationships icon to the left to see where.",
      "id": "139",
      "in_use": true
    },
    {
      "can_be_deleted_tooltip": "This dashboard is used in at least one scheduled report, click on the relationships icon to the left to see where.",
      "id": "92",
      "in_use": true
    }
  ],
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (10)

- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 1x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 1x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 1x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 1x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 1x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 1x)
- `cookie adminhtml` comes from `GET /server/api/dash/pages` `set-cookie adminhtml` (seen 1x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 1x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/dash/pages/{pageId}/thumbnail` `cookie adminhtml`

**Observed in** (1)

- YP Metrics tour, step `open-dashboards`, run `20261104T214824Z-f674`, 2026-11-04T21:49:07.959Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.832:0`

### `GET /server/api/dashfolders`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `all` | query | literal | `true` | no |
| `datatable` | query | literal | `true` | yes |
| `summary` | query | literal | `true` | yes |
| `sort` | query | literal | `name` | yes |
| `page` | query | literal | `0,10` | yes |
| `query_id` | query | computed | `0aa05670-3157-48cc-91bc-301bbe8d6ce2` | yes |
| `metadata` | query | literal | `true` | no |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "anyOf": [
        {
          "properties": {
            "aaData": {
              "items": {
                "properties": {
                  "can_be_accessed": {
                    "type": "boolean"
                  },
                  "can_be_copied": {
                    "type": "boolean"
                  },
                  "can_be_deleted": {
                    "type": "boolean"
                  },
                  "can_be_deleted_tooltip": {
                    "type": "string"
                  },
                  "can_be_edited": {
                    "type": "boolean"
                  },
                  "color": {
                    "type": "string"
                  },
                  "created_at": {
                    "type": "integer"
                  },
                  "created_by_display_name": {
                    "type": "string"
                  },
                  "formatted_created_at": {
                    "type": "string"
                  },
                  "formatted_updated_at": {
                    "type": "string"
                  },
                  "granular_access_levels": {
                    "type": "array"
                  },
                  "has_granular_permissions": {
                    "type": "boolean"
                  },
                  "id": {
                    "type": "string"
                  },
                  "name": {
                    "type": "string"
                  },
                  "parent_id": {
                    "type": "null"
                  },
                  "permission_client_group_id": {
                    "type": "array"
                  },
                  "permission_client_id": {
                    "type": "array"
                  },
                  "permission_cluster_id": {
                    "type": "array"
                  },
                  "thumbnail": {
                    "properties": {
                      "bytes": {
                        "type": "integer"
                      },
                      "format": {
                        "type": "string"
                      },
                      "height": {
                        "type": "integer"
                      },
                      "public_id": {
                        "type": "string"
                      },
                      "secure_url": {
                        "format": "uri",
                        "type": "string"
                      },
                      "url": {
                        "format": "uri",
                        "type": "string"
                      },
                      "width": {
                        "type": "integer"
                      }
                    },
                    "required": [
                      "public_id",
                      "secure_url",
                      "url",
                      "format",
                      "bytes",
                      "width",
                      "height"
                    ],
                    "type": "object"
                  },
                  "timegroup": {
                    "type": "string"
                  },
                  "total_clients": {
                    "type": "integer"
                  },
                  "total_files": {
                    "type": "integer"
                  },
                  "updated_at": {
                    "type": "integer"
                  },
                  "user_id": {
                    "type": "string"
                  }
                },
                "required": [
                  "id",
                  "name",
                  "parent_id",
                  "color",
                  "user_id",
                  "created_at",
                  "updated_at",
                  "thumbnail",
                  "created_by_display_name",
                  "total_clients",
                  "permission_client_id",
                  "permission_client_group_id",
                  "permission_cluster_id",
                  "total_files",
                  "timegroup",
                  "formatted_created_at",
                  "formatted_updated_at",
                  "has_granular_permissions",
                  "granular_access_levels",
                  "can_be_accessed",
                  "can_be_edited",
                  "can_be_deleted",
                  "can_be_copied",
                  "can_be_deleted_tooltip"
                ],
                "type": "object"
              },
              "type": "array"
            },
            "iTotalDisplayRecords": {
              "type": "integer"
            },
            "iTotalRecords": {
              "type": "integer"
            },
            "sEcho": {
              "type": "string"
            }
          },
          "required": [
            "sEcho",
            "iTotalRecords",
            "iTotalDisplayRecords",
            "aaData"
          ],
          "type": "object"
        },
        {
          "type": "array"
        }
      ]
    },
    "error": {
      "type": "boolean"
    },
    "metadata": {
      "properties": {
        "columns": {
          "items": {
            "properties": {
              "allows_null_value": {
                "type": "boolean"
              },
              "audit_name_column": {
                "type": "null"
              },
              "cell_class": {
                "type": "null"
              },
              "concat_columns_split": {
                "type": "string"
              },
              "custom_sort": {
                "type": "null"
              },
              "data_exporter": {
                "type": "boolean"
              },
              "default_sort": {
                "type": "null"
              },
              "details_order": {
                "type": "integer"
              },
              "edit_detail_group_id": {
                "type": "null"
              },
              "enable_history": {
                "type": "boolean"
              },
              "field": {
                "type": "string"
              },
              "filter_input_type": {
                "type": "null"
              },
              "foreign_mapping": {
                "type": "null"
              },
              "foreign_mapping_dependencies": {
                "type": "array"
              },
              "format": {
                "type": "string"
              },
              "has_set_values": {
                "type": "boolean"
              },
              "is_audit_metadata_column": {
                "type": "boolean"
              },
              "is_custom_cell_render": {
                "type": "boolean"
              },
              "is_exportable": {
                "type": "boolean"
              },
              "is_filterable": {
                "type": "boolean"
              },
              "is_foreign_audit_enabled": {
                "type": "boolean"
              },
              "is_foreign_field": {
                "type": "boolean"
              },
              "is_foreign_key": {
                "type": "boolean"
              },
              "is_groupable": {
                "type": "boolean"
              },
              "is_groupby_name_field": {
                "type": "boolean"
              },
              "is_hidden": {
                "type": "boolean"
              },
              "is_metric": {
                "type": "boolean"
              },
              "is_most_recent_value": {
                "type": "boolean"
              },
              "is_primary_key": {
                "type": "boolean"
              },
              "is_primary_name_field": {
                "type": "boolean"
              },
              "is_pseudo": {
                "type": "boolean"
              },
              "is_read_only": {
                "type": "boolean"
              },
              "is_required_in_datatable": {
                "type": "boolean"
              },
              "is_sortable": {
                "type": "boolean"
              },
              "is_taggable": {
                "type": "boolean"
              },
              "label": {
                "type": "string"
              },
              "original_date_format": {
                "type": "null"
              },
              "postprocess_type": {
                "type": "string"
              },
              "precision": {
                "type": "null"
              },
              "sticky": {
                "type": "boolean"
              },
              "summary_dependencies": {
                "type": "array"
              },
              "summary_order": {
                "type": "integer"
              },
              "tooltip": {
                "type": "null"
              },
              "values": {
                "type": "array"
              },
              "width": {
                "type": "null"
              }
            },
            "required": [
              "field",
              "label",
              "format",
              "values",
              "has_set_values",
              "details_order",
              "summary_order",
              "is_sortable",
              "cell_class",
              "width",
              "custom_sort",
              "default_sort",
              "tooltip",
              "postprocess_type",
              "is_read_only",
              "allows_null_value",
              "is_hidden",
              "is_primary_key",
              "is_primary_name_field",
              "original_date_format",
              "is_foreign_key",
              "is_foreign_field",
              "foreign_mapping",
              "foreign_mapping_dependencies",
              "concat_columns_split",
              "is_pseudo",
              "is_custom_cell_render",
              "is_groupable",
              "is_filterable",
              "sticky",
              "filter_input_type",
              "is_groupby_name_field",
              "is_most_recent_value",
              "is_metric",
              "precision",
              "enable_history",
              "is_taggable",
              "summary_dependencies",
              "edit_detail_group_id",
              "is_exportable",
              "is_required_in_datatable",
              "is_foreign_audit_enabled",
              "audit_name_column",
              "is_audit_metadata_column",
              "data_exporter"
            ],
            "type": "object"
          },
          "type": "array"
        }
      },
      "required": [
        "columns"
      ],
      "type": "object"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": {
    "aaData": [
      {
        "can_be_accessed": true,
        "can_be_copied": false,
        "can_be_deleted": false,
        "can_be_deleted_tooltip": "Cannot delete the folder because it contains dashboards.",
        "can_be_edited": false,
        "color": "#0c45a4",
        "created_at": 1779807107,
        "created_by_display_name": "Eric Thibodeau",
        "formatted_created_at": "May 26, 2026 10:51 AM",
        "formatted_updated_at": "May 26, 2026 10:51 AM",
        "granular_access_levels": [],
        "has_granular_permissions": false,
        "id": "3",
        "name": "Data-Science",
        "parent_id": null,
        "permission_client_group_id": [],
        "permission_client_id": [],
        "permission_cluster_id": [],
        "thumbnail": {
          "bytes": 21430,
          "format": "jpg",
          "height": 301,
          "public_id": "instances/ypcanada/dashboard_thumbnails/ypcanadatapclickscom6ab67fbc21818puppeteer_export_6ab67fbc1916643ff0801.jpg",
          "secure_url": "https://storage.googleapis.com/prod-client-cdnstaticassets-com/instances/ypcanada/dashboard_thumbnails/ypcanadatapclickscom6ab67fbc21818puppeteer_export_6ab67fbc1916643ff0801.jpg",
          "url": "https://storage.googleapis.com/prod-client-cdnstaticassets-com/instances/ypcanada/dashboard_thumbnails/ypcanadatapclickscom6ab67fbc21818puppeteer_export_6ab67fbc1916643ff0801.jpg",
          "width": 800
        },
        "timegroup": "hourly",
        "total_clients": 0,
        "total_files": 0,
        "updated_at": 1779807107,
        "user_id": "10940"
      },
      {
        "can_be_accessed": true,
        "can_be_copied": false,
        "can_be_deleted": false,
        "can_be_deleted_tooltip": "Cannot delete the folder because it contains dashboards.",
        "can_be_edited": false,
        "color": "#0c45a4",
        "created_at": 1778780462,
        "created_by_display_name": "Eric Thibodeau",
        "formatted_created_at": "May 14, 2026 1:41 PM",
        "formatted_updated_at": "May 14, 2026 1:41 PM",
        "granular_access_levels": [],
        "has_granular_permissions": false,
        "id": "2",
        "name": "Internal Reporting",
        "parent_id": null,
        "permission_client_group_id": [],
        "permission_client_id": [],
        "permission_cluster_id": [],
        "thumbnail": {
          "bytes": 67790,
          "format": "jpg",
          "height": 763,
          "public_id": "instances/ypcanada/dashboard_thumbnails/ypcanadatapclickscom6a9706de144e1puppeteer_export_6a9706dda505cb479fb35.jpg",
          "secure_url": "https://storage.googleapis.com/prod-client-cdnstaticassets-com/instances/ypcanada/dashboard_thumbnails/ypcanadatapclickscom6a9706de144e1puppeteer_export_6a9706dda505cb479fb35.jpg",
          "url": "https://storage.googleapis.com/prod-client-cdnstaticassets-com/instances/ypcanada/dashboard_thumbnails/ypcanadatapclickscom6a9706de144e1puppeteer_export_6a9706dda505cb479fb35.jpg",
          "width": 800
        },
        "timegroup": "hourly",
        "total_clients": 0,
        "total_files": 0,
        "updated_at": 1778780462,
        "user_id": "10940"
      }
    ],
    "iTotalDisplayRecords": 2,
    "iTotalRecords": 2,
    "sEcho": "prod"
  },
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (12)

- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 2x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 2x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 2x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 2x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 2x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 2x)
- `cookie adminhtml` comes from `GET /server/api/users/{userId}/listsettings` `set-cookie adminhtml` (seen 1x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 2x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 2x)
- `cookie adminhtml` comes from `GET /server/api/dashfolders` `set-cookie adminhtml` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/dash/pages` `cookie adminhtml`
- `set-cookie adminhtml` feeds `GET /server/api/dashfolders` `cookie adminhtml`

**Observed in** (2)

- YP Metrics tour, step `open-dashboards`, run `20261104T214824Z-f674`, 2026-11-04T21:49:07.779Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.824:0`
- YP Metrics tour, step `open-dashboards`, run `20261104T214824Z-f674`, 2026-11-04T21:49:07.780Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.825:0`

### `GET /server/api/dashfolders/isfoldersavailable`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `query_id` | query | computed | `9218560c-9aba-48a6-bc69-03ad0dc5f0dd` | unknown |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "type": "boolean"
    },
    "error": {
      "type": "boolean"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": true,
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (10)

- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 1x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 1x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 1x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 1x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 1x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 1x)
- `cookie adminhtml` comes from `storage` `storage cookie[adminhtml]` (seen 1x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 1x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/users/{userId}/listsettings` `cookie adminhtml`

**Observed in** (1)

- YP Metrics tour, step `open-dashboards`, run `20261104T214824Z-f674`, 2026-11-04T21:49:07.779Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.822:0`

### `GET /server/api/daterange`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `query_id` | query | computed | `9b8dceaf-6f22-4aa9-8a9a-86e9362fcc1a` | unknown |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "properties": {
        "comparison_end_date": {
          "type": "string"
        },
        "comparison_period": {
          "type": "null"
        },
        "comparison_start_date": {
          "type": "string"
        },
        "end_date": {
          "type": "string"
        },
        "formatted_comparison_end_date": {
          "type": "string"
        },
        "formatted_comparison_start_date": {
          "type": "string"
        },
        "formatted_end_date": {
          "type": "string"
        },
        "formatted_start_date": {
          "type": "string"
        },
        "is_comparison_active": {
          "type": "null"
        },
        "relative_date_range_key": {
          "type": "null"
        },
        "start_date": {
          "type": "string"
        }
      },
      "required": [
        "start_date",
        "end_date",
        "formatted_start_date",
        "formatted_end_date",
        "relative_date_range_key",
        "is_comparison_active",
        "comparison_period",
        "comparison_start_date",
        "comparison_end_date",
        "formatted_comparison_start_date",
        "formatted_comparison_end_date"
      ],
      "type": "object"
    },
    "error": {
      "type": "boolean"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": {
    "comparison_end_date": "2026-10-27",
    "comparison_period": null,
    "comparison_start_date": "2026-10-21",
    "end_date": "2026-11-03",
    "formatted_comparison_end_date": "Oct 27, 2026",
    "formatted_comparison_start_date": "Oct 21, 2026",
    "formatted_end_date": "Nov 03, 2026",
    "formatted_start_date": "Oct 28, 2026",
    "is_comparison_active": null,
    "relative_date_range_key": null,
    "start_date": "2026-10-28"
  },
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (8)

- `cookie ajs_user_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.userEmail` (seen 1x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 1x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 1x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 1x)
- `cookie ajs_group_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.instanceURL` (seen 1x)
- `cookie SimpleSAMLAuthToken` comes from `POST /simplesaml/module.php/saml/sp/saml2-acs.php/mymetrics_yp_ca_activedirectory_ypcanada` `set-cookie SimpleSAMLAuthToken` (seen 1x)
- `cookie adminhtml` comes from `GET /server/api/dash/dashboardfilters/{dashboardfilterId}` `set-cookie adminhtml` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/daterange/relativeranges` `cookie adminhtml`

**Observed in** (1)

- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:35.043Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.779:0`

### `POST /server/api/daterange`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

**Request**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "model": {
      "type": "string"
    }
  },
  "required": [
    "model"
  ],
  "type": "object"
}
```

Example:

```json
{
  "model": "{\"start_date\":\"2026-10-05\",\"end_date\":\"2026-11-03\",\"formatted_start_date\":\"Oct 28, 2026\",\"formatted_end_date\":\"Nov 03, 2026\",\"relative_date_range_key\":\"{redacted}\",\"comparison_start_date\":\"2026-09-05\",\"comparison_end_date\":\"2026-10-04\",\"formatted_comparison_start_date\":\"Oct 21, 2026\",\"formatted_comparison_end_date\":\"Oct 27, 2026\",\"is_comparison_active\":false,\"comparison_period\":\"priorperiod\"}"
}
```

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "type": "boolean"
    },
    "error": {
      "type": "boolean"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": true,
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (10)

- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 2x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 2x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 2x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 2x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 2x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 2x)
- `cookie adminhtml` comes from `storage` `storage cookie[adminhtml]` (seen 2x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 2x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 2x)
- `set-cookie adminhtml` feeds `GET /server/api/dash/{dashId}` `cookie adminhtml`

**Observed in** (2)

- YP Metrics tour, step `range-30-days`, run `20261104T214824Z-f674`, 2026-11-04T21:55:36.230Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1196:0`
- YP Metrics tour, step `range-last-month`, run `20261104T214824Z-f674`, 2026-11-04T21:55:57.902Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1213:0`

### `GET /server/api/daterange/relativeranges`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `query_id` | query | computed | `d3105db4-db3c-4b7e-9fb7-7c6b5c69d847` | unknown |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "items": {
        "properties": {
          "comparison_end": {
            "type": [
              "string",
              "null"
            ]
          },
          "comparison_start": {
            "type": [
              "string",
              "null"
            ]
          },
          "end": {
            "type": [
              "string",
              "null"
            ]
          },
          "key": {
            "type": "string"
          },
          "label": {
            "type": "string"
          },
          "start": {
            "type": [
              "string",
              "null"
            ]
          }
        },
        "required": [
          "key",
          "label",
          "start",
          "end",
          "comparison_start",
          "comparison_end"
        ],
        "type": "object"
      },
      "type": "array"
    },
    "error": {
      "type": "boolean"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": [
    {
      "comparison_end": "2026-10-27",
      "comparison_start": "2026-10-21",
      "end": "2026-11-03",
      "key": "{redacted}",
      "label": "Default (Dashboard Date)",
      "start": "2026-10-28"
    },
    {
      "comparison_end": "2026-11-03",
      "comparison_start": "2026-11-03",
      "end": "2026-11-04",
      "key": "{redacted}",
      "label": "Today",
      "start": "2026-11-04"
    }
  ],
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (8)

- `cookie ajs_user_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.userEmail` (seen 1x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 1x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 1x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 1x)
- `cookie ajs_group_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.instanceURL` (seen 1x)
- `cookie SimpleSAMLAuthToken` comes from `POST /simplesaml/module.php/saml/sp/saml2-acs.php/mymetrics_yp_ca_activedirectory_ypcanada` `set-cookie SimpleSAMLAuthToken` (seen 1x)
- `cookie adminhtml` comes from `GET /server/api/daterange` `set-cookie adminhtml` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/branding/mappings` `cookie adminhtml`

**Observed in** (1)

- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:35.043Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.780:0`

### `GET /server/api/endcustomers`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `all` | query | literal | `true` | no |
| `datatable` | query | literal | `true` | yes |
| `summary` | query | literal | `true` | yes |
| `page` | query | literal | `0,50` | yes |
| `query_id` | query | computed | `5058c663-7bbf-4b4e-a9f5-ad541c83f694` | yes |
| `metadata` | query | literal | `true` | no |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "anyOf": [
        {
          "properties": {
            "aaData": {
              "type": "array"
            },
            "iTotalDisplayRecords": {
              "type": "integer"
            },
            "iTotalRecords": {
              "type": "integer"
            },
            "sEcho": {
              "type": "string"
            }
          },
          "required": [
            "sEcho",
            "iTotalRecords",
            "iTotalDisplayRecords",
            "aaData"
          ],
          "type": "object"
        },
        {
          "type": "array"
        }
      ]
    },
    "error": {
      "type": "boolean"
    },
    "metadata": {
      "properties": {
        "columns": {
          "items": {
            "properties": {
              "allows_null_value": {
                "type": "boolean"
              },
              "audit_name_column": {
                "type": "null"
              },
              "cell_class": {
                "type": "null"
              },
              "concat_columns_split": {
                "type": "string"
              },
              "custom_sort": {
                "type": "null"
              },
              "data_exporter": {
                "type": "boolean"
              },
              "default_sort": {
                "type": "null"
              },
              "details_order": {
                "type": "integer"
              },
              "edit_detail_group_id": {
                "type": "null"
              },
              "enable_history": {
                "type": "boolean"
              },
              "field": {
                "type": "string"
              },
              "filter_input_type": {
                "type": "null"
              },
              "foreign_mapping": {
                "properties": {
                  "clause_conditions": {
                    "items": {
                      "properties": {
                        "clause_operator": {
                          "type": "string"
                        },
                        "condition_operator": {
                          "type": "string"
                        },
                        "foreign_field": {
                          "type": "string"
                        },
                        "source_field": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "source_field",
                        "foreign_field",
                        "condition_operator",
                        "clause_operator"
                      ],
                      "type": "object"
                    },
                    "type": "array"
                  },
                  "default_null_display_value": {
                    "type": "null"
                  },
                  "foreign_dependencies": {
                    "type": "array"
                  },
                  "foreign_entity_field": {
                    "type": "null"
                  },
                  "foreign_entity_route": {
                    "type": "string"
                  },
                  "foreign_expression_fields": {
                    "type": "array"
                  },
                  "foreign_fields": {
                    "properties": {
                      "client_name": {
                        "type": "string"
                      }
                    },
                    "required": [
                      "client_name"
                    ],
                    "type": "object"
                  },
                  "foreign_is_service_data_table": {
                    "type": "boolean"
                  },
                  "foreign_table_alias": {
                    "type": "null"
                  },
                  "foreign_table_name": {
                    "type": "string"
                  },
                  "foreign_values_route": {
                    "type": "string"
                  },
                  "has_object_mapping": {
                    "type": "boolean"
                  },
                  "intermediary_mappings": {
                    "type": "array"
                  },
                  "is_expression_mapping": {
                    "type": "boolean"
                  },
                  "is_forceful_mapping": {
                    "type": "null"
                  },
                  "is_intermediary_join": {
                    "type": "boolean"
                  },
                  "join_type": {
                    "type": "string"
                  },
                  "object_mapping_fields": {
                    "type": "null"
                  },
                  "object_mapping_key": {
                    "type": "null"
                  },
                  "param_bindings": {
                    "type": "null"
                  },
                  "query_type": {
                    "type": "null"
                  },
                  "source_join_table_name": {
                    "type": "string"
                  },
                  "sub_query_fields": {
                    "type": "null"
                  }
                },
                "required": [
                  "foreign_table_name",
                  "foreign_fields",
                  "foreign_expression_fields",
                  "foreign_table_alias",
                  "foreign_entity_route",
                  "foreign_values_route",
                  "source_join_table_name",
                  "default_null_display_value",
                  "join_type",
                  "clause_conditions",
                  "is_intermediary_join",
                  "is_forceful_mapping",
                  "is_expression_mapping",
                  "has_object_mapping",
                  "intermediary_mappings",
                  "query_type",
                  "object_mapping_key",
                  "object_mapping_fields",
                  "foreign_entity_field",
                  "foreign_is_service_data_table",
                  "param_bindings",
                  "foreign_dependencies",
                  "sub_query_fields"
                ],
                "type": [
                  "object",
                  "null"
                ]
              },
              "foreign_mapping_dependencies": {
                "type": "array"
              },
              "format": {
                "type": "string"
              },
              "has_set_values": {
                "type": "boolean"
              },
              "is_audit_metadata_column": {
                "type": "boolean"
              },
              "is_custom_cell_render": {
                "type": "boolean"
              },
              "is_exportable": {
                "type": "boolean"
              },
              "is_filterable": {
                "type": "boolean"
              },
              "is_foreign_audit_enabled": {
                "type": "boolean"
              },
              "is_foreign_field": {
                "type": "boolean"
              },
              "is_foreign_key": {
                "type": "boolean"
              },
              "is_groupable": {
                "type": "boolean"
              },
              "is_groupby_name_field": {
                "type": "boolean"
              },
              "is_hidden": {
                "type": "boolean"
              },
              "is_metric": {
                "type": "boolean"
              },
              "is_most_recent_value": {
                "type": "boolean"
              },
              "is_primary_key": {
                "type": "boolean"
              },
              "is_primary_name_field": {
                "type": "boolean"
              },
              "is_pseudo": {
                "type": "boolean"
              },
              "is_read_only": {
                "type": "boolean"
              },
              "is_required_in_datatable": {
                "type": "boolean"
              },
              "is_sortable": {
                "type": "boolean"
              },
              "is_taggable": {
                "type": "boolean"
              },
              "label": {
                "type": "string"
              },
              "original_date_format": {
                "type": "null"
              },
              "postprocess_type": {
                "type": "string"
              },
              "precision": {
                "type": "null"
              },
              "sticky": {
                "type": "boolean"
              },
              "summary_dependencies": {
                "type": "array"
              },
              "summary_order": {
                "type": "integer"
              },
              "tooltip": {
                "type": "null"
              },
              "values": {
                "type": "array"
              },
              "width": {
                "type": "null"
              }
            },
            "required": [
              "field",
              "label",
              "format",
              "values",
              "has_set_values",
              "details_order",
              "summary_order",
              "is_sortable",
              "cell_class",
              "width",
              "custom_sort",
              "default_sort",
              "tooltip",
              "postprocess_type",
              "is_read_only",
              "allows_null_value",
              "is_hidden",
              "is_primary_key",
              "is_primary_name_field",
              "original_date_format",
              "is_foreign_key",
              "is_foreign_field",
              "foreign_mapping",
              "foreign_mapping_dependencies",
              "concat_columns_split",
              "is_pseudo",
              "is_custom_cell_render",
              "is_groupable",
              "is_filterable",
              "sticky",
              "filter_input_type",
              "is_groupby_name_field",
              "is_most_recent_value",
              "is_metric",
              "precision",
              "enable_history",
              "is_taggable",
              "summary_dependencies",
              "edit_detail_group_id",
              "is_exportable",
              "is_required_in_datatable",
              "is_foreign_audit_enabled",
              "audit_name_column",
              "is_audit_metadata_column",
              "data_exporter"
            ],
            "type": "object"
          },
          "type": "array"
        }
      },
      "required": [
        "columns"
      ],
      "type": "object"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": {
    "aaData": [],
    "iTotalDisplayRecords": 0,
    "iTotalRecords": 0,
    "sEcho": "prod"
  },
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (11)

- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 2x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 2x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 2x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 2x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 2x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 2x)
- `cookie adminhtml` comes from `storage` `storage cookie[adminhtml]` (seen 1x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 2x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 2x)
- `cookie adminhtml` comes from `GET /server/api/endcustomers` `set-cookie adminhtml` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/endcustomers` `cookie adminhtml`

**Observed in** (2)

- YP Metrics tour, step `open-endcustomers`, run `20261104T214824Z-f674`, 2026-11-04T21:52:21.789Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.977:0`
- YP Metrics tour, step `open-endcustomers`, run `20261104T214824Z-f674`, 2026-11-04T21:52:21.789Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.978:0`

### `GET /server/api/leads`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `query_id` | query | computed | `4f100ec4-f1ff-404a-863f-8fed459bc1a7` | yes |
| `daterange` | query | literal | `2026-10-28\|2026-11-03` | yes |
| `fields` | query | literal | `id,note_count,timestamp,service_name,type,client_name,campaign_name,quality,first_name,last_name,customer_number,customer_email,customer_name,is_overriden` | yes |
| `aggregate` | query | literal | `false` | no |
| `datatable` | query | literal | `true` | no |
| `page` | query | literal | `0,10` | no |
| `sort` | query | binding | `-timestamp` | yes |
| `widget_request` | query | binding | `5159` | yes |
| `widget_type` | query | binding | `datagrid` | yes |
| `widget_page_id` | query | literal | `65` | yes |
| `groupby` | query | binding | `service_id` | no |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "anyOf": [
        {
          "properties": {
            "aaData": {
              "items": {
                "properties": {
                  "call_was_recorded": {
                    "type": "string"
                  },
                  "campaign_id": {
                    "type": "string"
                  },
                  "campaign_name": {
                    "type": "string"
                  },
                  "client_id": {
                    "type": "integer"
                  },
                  "client_name": {
                    "type": "string"
                  },
                  "client_name_color": {
                    "type": "null"
                  },
                  "client_name_tag": {
                    "type": "string"
                  },
                  "client_name_tag_id": {
                    "type": "null"
                  },
                  "client_name_value": {
                    "type": "null"
                  },
                  "client_name_value_id": {
                    "type": "null"
                  },
                  "client_reporting_status": {
                    "type": "string"
                  },
                  "customer_email": {
                    "type": "null"
                  },
                  "customer_email_color": {
                    "type": "null"
                  },
                  "customer_email_tag": {
                    "type": "string"
                  },
                  "customer_email_tag_id": {
                    "type": "null"
                  },
                  "customer_email_value": {
                    "type": "null"
                  },
                  "customer_email_value_id": {
                    "type": "null"
                  },
                  "customer_name": {
                    "type": "null"
                  },
                  "customer_number": {
                    "type": "string"
                  },
                  "customer_number_color": {
                    "type": "null"
                  },
                  "customer_number_tag": {
                    "type": "string"
                  },
                  "customer_number_tag_id": {
                    "type": "null"
                  },
                  "customer_number_value": {
                    "type": "null"
                  },
                  "customer_number_value_id": {
                    "type": "null"
                  },
                  "end_customer_id": {
                    "type": "null"
                  },
                  "first_name": {
                    "type": "null"
                  },
                  "formatted_customer_number": {
                    "type": "string"
                  },
                  "formatted_timestamp": {
                    "type": "string"
                  },
                  "has_history": {
                    "type": "boolean"
                  },
                  "id": {
                    "type": "null"
                  },
                  "is_overriden": {
                    "type": "boolean"
                  },
                  "last_name": {
                    "type": "null"
                  },
                  "lead_id": {
                    "type": "string"
                  },
                  "note_count": {
                    "type": "null"
                  },
                  "quality": {
                    "type": "null"
                  },
                  "quality_display": {
                    "type": "null"
                  },
                  "row_grouping_count": {
                    "type": "string"
                  },
                  "service_id": {
                    "type": "string"
                  },
                  "service_lead_id": {
                    "type": "string"
                  },
                  "service_name": {
                    "type": "string"
                  },
                  "status_display": {
                    "type": "null"
                  },
                  "tags": {
                    "type": "array"
                  },
                  "timegroup": {
                    "type": "string"
                  },
                  "timestamp": {
                    "type": "integer"
                  },
                  "tracking_source": {
                    "type": "null"
                  },
                  "tracking_source_color": {
                    "type": "null"
                  },
                  "tracking_source_tag": {
                    "type": "string"
                  },
                  "tracking_source_tag_id": {
                    "type": "null"
                  },
                  "tracking_source_value": {
                    "type": "null"
                  },
                  "tracking_source_value_id": {
                    "type": "null"
                  },
                  "type": {
                    "type": "string"
                  },
                  "visibility_display": {
                    "type": "null"
                  }
                },
                "required": [
                  "id",
                  "note_count",
                  "timestamp",
                  "service_name",
                  "type",
                  "campaign_name",
                  "quality",
                  "first_name",
                  "last_name",
                  "customer_number",
                  "customer_email",
                  "is_overriden",
                  "service_lead_id",
                  "service_id",
                  "end_customer_id",
                  "lead_id",
                  "client_id",
                  "campaign_id",
                  "client_name",
                  "client_reporting_status",
                  "customer_name",
                  "client_name_value",
                  "client_name_value_id",
                  "client_name_tag",
                  "client_name_color",
                  "client_name_tag_id",
                  "customer_number_value",
                  "customer_number_value_id",
                  "customer_number_tag",
                  "customer_number_color",
                  "customer_number_tag_id",
                  "customer_email_value",
                  "customer_email_value_id",
                  "customer_email_tag",
                  "customer_email_color",
                  "customer_email_tag_id",
                  "tracking_source_value",
                  "tracking_source_value_id",
                  "tracking_source_tag",
                  "tracking_source_color",
                  "tracking_source_tag_id",
                  "row_grouping_count",
                  "visibility_display",
                  "quality_display",
                  "status_display",
                  "formatted_customer_number",
                  "call_was_recorded",
                  "timegroup",
                  "formatted_timestamp",
                  "has_history",
                  "tags"
                ],
                "type": "object"
              },
              "type": "array"
            },
            "iTotalDisplayRecords": {
              "type": "integer"
            },
            "iTotalRecords": {
              "type": "integer"
            },
            "sEcho": {
              "type": "string"
            }
          },
          "required": [
            "sEcho",
            "iTotalRecords",
            "iTotalDisplayRecords",
            "aaData"
          ],
          "type": "object"
        },
        {
          "items": {
            "properties": {
              "answer_count": {
                "type": "string"
              },
              "busy_count": {
                "type": "null"
              },
              "call_was_recorded": {
                "type": "string"
              },
              "campaign_id": {
                "type": "string"
              },
              "cancel_count": {
                "type": "null"
              },
              "client_id": {
                "type": "integer"
              },
              "client_name": {
                "type": "string"
              },
              "client_name_color": {
                "type": "null"
              },
              "client_name_tag": {
                "type": "string"
              },
              "client_name_tag_id": {
                "type": "null"
              },
              "client_name_value": {
                "type": "null"
              },
              "client_name_value_id": {
                "type": "null"
              },
              "client_reporting_status": {
                "type": "string"
              },
              "customer_email_color": {
                "type": "null"
              },
              "customer_email_tag": {
                "type": "string"
              },
              "customer_email_tag_id": {
                "type": "null"
              },
              "customer_email_value": {
                "type": "null"
              },
              "customer_email_value_id": {
                "type": "null"
              },
              "customer_name": {
                "type": "null"
              },
              "customer_number_color": {
                "type": "null"
              },
              "customer_number_tag": {
                "type": "string"
              },
              "customer_number_tag_id": {
                "type": "null"
              },
              "customer_number_value": {
                "type": "null"
              },
              "customer_number_value_id": {
                "type": "null"
              },
              "end_customer_id": {
                "type": "null"
              },
              "formatted_timestamp": {
                "type": "string"
              },
              "has_history": {
                "type": "boolean"
              },
              "id": {
                "type": "null"
              },
              "lead_id": {
                "type": "string"
              },
              "noforwards_count": {
                "type": "null"
              },
              "quality_display": {
                "type": "null"
              },
              "row_grouping_count": {
                "type": "string"
              },
              "service_id": {
                "type": "string"
              },
              "service_lead_id": {
                "type": "string"
              },
              "service_name": {
                "type": "string"
              },
              "status_display": {
                "type": "null"
              },
              "tags": {
                "type": "array"
              },
              "timegroup": {
                "type": "string"
              },
              "timestamp": {
                "type": "integer"
              },
              "tracking_source_color": {
                "type": "null"
              },
              "tracking_source_tag": {
                "type": "string"
              },
              "tracking_source_tag_id": {
                "type": "null"
              },
              "tracking_source_value": {
                "type": "null"
              },
              "tracking_source_value_id": {
                "type": "null"
              },
              "type": {
                "type": "string"
              },
              "visibility_display": {
                "type": "null"
              },
              "voicemail_count": {
                "type": "string"
              }
            },
            "required": [
              "service_name",
              "id",
              "type",
              "service_lead_id",
              "service_id",
              "end_customer_id",
              "lead_id",
              "client_id",
              "campaign_id",
              "timestamp",
              "client_name",
              "client_reporting_status",
              "customer_name",
              "client_name_value",
              "client_name_value_id",
              "client_name_tag",
              "client_name_color",
              "client_name_tag_id",
              "customer_number_value",
              "customer_number_value_id",
              "customer_number_tag",
              "customer_number_color",
              "customer_number_tag_id",
              "customer_email_value",
              "customer_email_value_id",
              "customer_email_tag",
              "customer_email_color",
              "customer_email_tag_id",
              "tracking_source_value",
              "tracking_source_value_id",
              "tracking_source_tag",
              "tracking_source_color",
              "tracking_source_tag_id",
              "row_grouping_count",
              "answer_count",
              "busy_count",
              "cancel_count",
              "noforwards_count",
              "voicemail_count",
              "visibility_display",
              "quality_display",
              "status_display",
              "call_was_recorded",
              "timegroup",
              "formatted_timestamp",
              "has_history",
              "tags"
            ],
            "type": "object"
          },
          "type": "array"
        }
      ]
    },
    "error": {
      "type": "boolean"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": {
    "aaData": [
      {
        "call_was_recorded": "<audio preload=\"none\" controls><source src=\"https://webservice.telmetrics.com/filedownload.ashx/1E65C296-BA77-4CF0-9351-4952FBEA6CBE/2805394489.mp3\" type=\"audio/mpeg\">Your browser does not support the audio element. Please upgrade to a recent browser.</audio>",
        "campaign_id": "5054",
        "campaign_name": "Roof Doctor",
        "client_id": 39068,
        "client_name": "Roof Doctor | 250-765-3013 | 3-715 Evans Crt | 4302054",
        "client_name_color": null,
        "client_name_tag": "No Tag",
        "client_name_tag_id": null,
        "client_name_value": null,
        "client_name_value_id": null,
        "client_reporting_status": "active",
        "customer_email": null,
        "customer_email_color": null,
        "customer_email_tag": "{redacted}",
        "customer_email_tag_id": null,
        "customer_email_value": null,
        "customer_email_value_id": null,
        "customer_name": null,
        "customer_number": "7788346417",
        "customer_number_color": null,
        "customer_number_tag": "No Tag",
        "customer_number_tag_id": null,
        "customer_number_value": null,
        "customer_number_value_id": null,
        "end_customer_id": null,
        "first_name": null,
        "formatted_customer_number": "{redacted}",
        "formatted_timestamp": "Nov 02, 2026 5:18 AM",
        "has_history": false,
        "id": null,
        "is_overriden": false,
        "last_name": null,
        "lead_id": "15736311",
        "note_count": null,
        "quality": null,
        "quality_display": null,
        "row_grouping_count": "1",
        "service_id": "281",
        "service_lead_id": "1354332",
        "service_name": "Marchex Marketing Edge",
        "status_display": null,
        "tags": [],
        "timegroup": "hourly",
        "timestamp": 1793614709,
        "tracking_source_color": null,
        "tracking_source_tag": "No Tag",
        "tracking_source_tag_id": null,
        "tracking_source_value": null,
        "tracking_source_value_id": null,
        "type": "call",
        "visibility_display": null
      },
      {
        "call_was_recorded": "<audio preload=\"none\" controls><source src=\"https://webservice.telmetrics.com/filedownload.ashx/FCE61279-672E-478A-AEA5-C3AA11BD7355/2805393699.mp3\" type=\"audio/mpeg\">Your browser does not support the audio element. Please upgrade to a recent browser.</audio>",
        "campaign_id": "5054",
        "campaign_name": "Roof Doctor",
        "client_id": 39068,
        "client_name": "Roof Doctor | 250-765-3013 | 3-715 Evans Crt | 4302054",
        "client_name_color": null,
        "client_name_tag": "No Tag",
        "client_name_tag_id": null,
        "client_name_value": null,
        "client_name_value_id": null,
        "client_reporting_status": "active",
        "customer_email": null,
        "customer_email_color": null,
        "customer_email_tag": "{redacted}",
        "customer_email_tag_id": null,
        "customer_email_value": null,
        "customer_email_value_id": null,
        "customer_name": null,
        "customer_number": "7788346417",
        "customer_number_color": null,
        "customer_number_tag": "No Tag",
        "customer_number_tag_id": null,
        "customer_number_value": null,
        "customer_number_value_id": null,
        "end_customer_id": null,
        "first_name": null,
        "formatted_customer_number": "{redacted}",
        "formatted_timestamp": "Nov 02, 2026 5:15 AM",
        "has_history": false,
        "id": null,
        "is_overriden": false,
        "last_name": null,
        "lead_id": "15736310",
        "note_count": null,
        "quality": null,
        "quality_display": null,
        "row_grouping_count": "1",
        "service_id": "281",
        "service_lead_id": "1354331",
        "service_name": "Marchex Marketing Edge",
        "status_display": null,
        "tags": [],
        "timegroup": "hourly",
        "timestamp": 1793614537,
        "tracking_source_color": null,
        "tracking_source_tag": "No Tag",
        "tracking_source_tag_id": null,
        "tracking_source_value": null,
        "tracking_source_value_id": null,
        "type": "call",
        "visibility_display": null
      }
    ],
    "iTotalDisplayRecords": 2,
    "iTotalRecords": 2,
    "sEcho": "prod"
  },
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (18)

- `query widget_request` comes from `GET /server/api/dash/leads` `response.body $.data.page.widget_ids[0]` (seen 1x)
- `query widget_type` comes from `GET /server/api/dash/leads` `response.body $.data.page.layouts.65.widgets.5159.type` (seen 1x)
- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 3x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 3x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 3x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 3x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 3x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 3x)
- `cookie adminhtml` comes from `GET /server/api/services` `set-cookie adminhtml` (seen 2x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 3x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 3x)
- `query sort` comes from `GET /server/api/dash/leads` `response.body $.data.page.layouts.65.widgets.5159.metadata.data_columns.selected[2].field` (seen 1x)
- `query groupby` comes from `GET /server/api/dash/leads` `response.body $.data.page.layouts.65.widgets.5159.metadata.data_columns.selected[3].groupby_id_field` (seen 1x)
- `query widget_request` comes from `GET /server/api/dash/leads` `response.body $.data.page.widget_ids[1]` (seen 1x)
- `query widget_type` comes from `GET /server/api/dash/leads` `response.body $.data.page.layouts.65.widgets.5160.type` (seen 1x)
- `cookie adminhtml` comes from `GET /server/api/leads` `set-cookie adminhtml` (seen 1x)
- `query widget_type` comes from `GET /server/api/admin/manageleads` `response.body $.data.page.layouts.1.widgets.1.type` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/leads` `cookie adminhtml`

**Observed in** (3)

- YP Metrics tour, step `open-leads`, run `20261104T214824Z-f674`, 2026-11-04T21:51:38.992Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.956:0`
- YP Metrics tour, step `open-leads`, run `20261104T214824Z-f674`, 2026-11-04T21:51:38.993Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.957:0`
- YP Metrics tour, step `open-manageleads`, run `20261104T214824Z-f674`, 2026-11-04T21:52:00.567Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.970:0`

### `POST /server/api/log_performance`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

**Request**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "domContentLoadedTime": {
      "type": "integer"
    },
    "event": {
      "type": "string"
    },
    "loadTime": {
      "type": "integer"
    }
  },
  "required": [
    "domContentLoadedTime",
    "loadTime",
    "event"
  ],
  "type": "object"
}
```

Example:

```json
{
  "domContentLoadedTime": 129,
  "event": "login_page",
  "loadTime": 224
}
```

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "type": "string"
    },
    "error": {
      "type": "boolean"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": "Logged Successfully",
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (10)

- `cookie ajs_user_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.userEmail` (seen 1x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 1x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 1x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 1x)
- `cookie ajs_group_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.instanceURL` (seen 1x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 1x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 1x)
- `cookie SimpleSAMLAuthToken` comes from `POST /simplesaml/module.php/saml/sp/saml2-acs.php/mymetrics_yp_ca_activedirectory_ypcanada` `set-cookie SimpleSAMLAuthToken` (seen 1x)
- `cookie adminhtml` comes from `GET /server/api/session/initUser` `set-cookie adminhtml` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/session/initUser` `cookie adminhtml`

**Observed in** (1)

- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:33.155Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.664:0`

### `GET /server/api/nav/app`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "items": {
        "properties": {
          "icon": {
            "type": "string"
          },
          "index": {
            "type": "integer"
          },
          "items": {
            "properties": {
              "dashboards": {
                "properties": {
                  "disabled": {
                    "type": "boolean"
                  },
                  "feature_details": {
                    "type": "string"
                  },
                  "group_key": {
                    "type": "string"
                  },
                  "icon": {
                    "type": "null"
                  },
                  "index": {
                    "type": "integer"
                  },
                  "is_beta": {
                    "type": "boolean"
                  },
                  "is_coming_soon": {
                    "type": "boolean"
                  },
                  "is_group_child": {
                    "type": "boolean"
                  },
                  "is_new": {
                    "type": "boolean"
                  },
                  "is_trademark": {
                    "type": "boolean"
                  },
                  "key": {
                    "type": "null"
                  },
                  "link": {
                    "type": "string"
                  },
                  "should_trigger_upsell_email": {
                    "type": "boolean"
                  },
                  "subtitle": {
                    "type": "null"
                  },
                  "suppress_tooltip": {
                    "type": "boolean"
                  },
                  "title": {
                    "type": "string"
                  },
                  "tooltip": {
                    "type": "null"
                  }
                },
                "required": [
                  "title",
                  "subtitle",
                  "feature_details",
                  "icon",
                  "link",
                  "index",
                  "is_group_child",
                  "group_key",
                  "tooltip",
                  "disabled",
                  "key",
                  "is_new",
                  "is_beta",
                  "is_coming_soon",
                  "should_trigger_upsell_email",
                  "is_trademark",
                  "suppress_tooltip"
                ],
                "type": "object"
              },
              "endcustomers": {
                "properties": {
                  "disabled": {
                    "type": "boolean"
                  },
                  "feature_details": {
                    "type": "string"
                  },
                  "group_key": {
                    "type": "string"
                  },
                  "icon": {
                    "type": "null"
                  },
                  "index": {
                    "type": "integer"
                  },
                  "is_beta": {
                    "type": "boolean"
                  },
                  "is_coming_soon": {
                    "type": "boolean"
                  },
                  "is_group_child": {
                    "type": "boolean"
                  },
                  "is_new": {
                    "type": "boolean"
                  },
                  "is_trademark": {
                    "type": "boolean"
                  },
                  "key": {
                    "type": "null"
                  },
                  "link": {
                    "type": "string"
                  },
                  "should_trigger_upsell_email": {
                    "type": "boolean"
                  },
                  "subtitle": {
                    "type": "null"
                  },
                  "suppress_tooltip": {
                    "type": "boolean"
                  },
                  "title": {
                    "type": "string"
                  },
                  "tooltip": {
                    "type": "null"
                  }
                },
                "required": [
                  "title",
                  "subtitle",
                  "feature_details",
                  "icon",
                  "link",
                  "index",
                  "is_group_child",
                  "group_key",
                  "tooltip",
                  "disabled",
                  "key",
                  "is_new",
                  "is_beta",
                  "is_coming_soon",
                  "should_trigger_upsell_email",
                  "is_trademark",
                  "suppress_tooltip"
                ],
                "type": "object"
              },
              "executivesummaries": {
                "properties": {
                  "disabled": {
                    "type": "boolean"
                  },
                  "feature_details": {
                    "type": "string"
                  },
                  "group_key": {
                    "type": "string"
                  },
                  "icon": {
                    "type": "null"
                  },
                  "index": {
                    "type": "integer"
                  },
                  "is_beta": {
                    "type": "boolean"
                  },
                  "is_coming_soon": {
                    "type": "boolean"
                  },
                  "is_group_child": {
                    "type": "boolean"
                  },
                  "is_new": {
                    "type": "boolean"
                  },
                  "is_trademark": {
                    "type": "boolean"
                  },
                  "key": {
                    "type": "null"
                  },
                  "link": {
                    "type": "string"
                  },
                  "should_trigger_upsell_email": {
                    "type": "boolean"
                  },
                  "subtitle": {
                    "type": "null"
                  },
                  "suppress_tooltip": {
                    "type": "boolean"
                  },
                  "title": {
                    "type": "string"
                  },
                  "tooltip": {
                    "type": "null"
                  }
                },
                "required": [
                  "title",
                  "subtitle",
                  "feature_details",
                  "icon",
                  "link",
                  "index",
                  "is_group_child",
                  "group_key",
                  "tooltip",
                  "disabled",
                  "key",
                  "is_new",
                  "is_beta",
                  "is_coming_soon",
                  "should_trigger_upsell_email",
                  "is_trademark",
                  "suppress_tooltip"
                ],
                "type": "object"
              },
              "favorite_dashboard_139": {
                "properties": {
                  "disabled": {
                    "type": "boolean"
                  },
                  "feature_details": {
                    "type": "string"
                  },
                  "group_key": {
                    "type": "string"
                  },
                  "icon": {
                    "type": "null"
                  },
                  "index": {
                    "type": "integer"
                  },
                  "is_beta": {
                    "type": "boolean"
                  },
                  "is_coming_soon": {
                    "type": "boolean"
                  },
                  "is_group_child": {
                    "type": "boolean"
                  },
                  "is_new": {
                    "type": "boolean"
                  },
                  "is_trademark": {
                    "type": "boolean"
                  },
                  "key": {
                    "type": "string"
                  },
                  "link": {
                    "type": "string"
                  },
                  "selected_entity": {
                    "type": "null"
                  },
                  "should_trigger_upsell_email": {
                    "type": "boolean"
                  },
                  "subtitle": {
                    "type": "null"
                  },
                  "suppress_tooltip": {
                    "type": "boolean"
                  },
                  "title": {
                    "type": "string"
                  },
                  "tooltip": {
                    "type": "null"
                  }
                },
                "required": [
                  "title",
                  "subtitle",
                  "feature_details",
                  "icon",
                  "link",
                  "index",
                  "is_group_child",
                  "group_key",
                  "tooltip",
                  "disabled",
                  "key",
                  "is_new",
                  "is_beta",
                  "is_coming_soon",
                  "should_trigger_upsell_email",
                  "is_trademark",
                  "suppress_tooltip",
                  "selected_entity"
                ],
                "type": "object"
              },
              "favorite_dashboard_92": {
                "properties": {
                  "disabled": {
                    "type": "boolean"
                  },
                  "feature_details": {
                    "type": "string"
                  },
                  "group_key": {
                    "type": "string"
                  },
                  "icon": {
                    "type": "null"
                  },
                  "index": {
                    "type": "integer"
                  },
                  "is_beta": {
                    "type": "boolean"
                  },
                  "is_coming_soon": {
                    "type": "boolean"
                  },
                  "is_group_child": {
                    "type": "boolean"
                  },
                  "is_new": {
                    "type": "boolean"
                  },
                  "is_trademark": {
                    "type": "boolean"
                  },
                  "key": {
                    "type": "string"
                  },
                  "link": {
                    "type": "string"
                  },
                  "selected_entity": {
                    "type": "null"
                  },
                  "should_trigger_upsell_email": {
                    "type": "boolean"
                  },
                  "subtitle": {
                    "type": "null"
                  },
                  "suppress_tooltip": {
                    "type": "boolean"
                  },
                  "title": {
                    "type": "string"
                  },
                  "tooltip": {
                    "type": "null"
                  }
                },
                "required": [
                  "title",
                  "subtitle",
                  "feature_details",
                  "icon",
                  "link",
                  "index",
                  "is_group_child",
                  "group_key",
                  "tooltip",
                  "disabled",
                  "key",
                  "is_new",
                  "is_beta",
                  "is_coming_soon",
                  "should_trigger_upsell_email",
                  "is_trademark",
                  "suppress_tooltip",
                  "selected_entity"
                ],
                "type": "object"
              },
              "favorites_dashboards": {
                "properties": {
                  "disabled": {
                    "type": "boolean"
                  },
                  "feature_details": {
                    "type": "string"
                  },
                  "group_key": {
                    "type": "string"
                  },
                  "icon": {
                    "type": "null"
                  },
                  "index": {
                    "type": "integer"
                  },
                  "is_beta": {
                    "type": "boolean"
                  },
                  "is_coming_soon": {
                    "type": "boolean"
                  },
                  "is_group_child": {
                    "type": "boolean"
                  },
                  "is_new": {
                    "type": "boolean"
                  },
                  "is_trademark": {
                    "type": "boolean"
                  },
                  "key": {
                    "type": "null"
                  },
                  "link": {
                    "type": "null"
                  },
                  "should_trigger_upsell_email": {
                    "type": "boolean"
                  },
                  "subtitle": {
                    "type": "null"
                  },
                  "suppress_tooltip": {
                    "type": "boolean"
                  },
                  "title": {
                    "type": "string"
                  },
                  "tooltip": {
                    "type": "null"
                  }
                },
                "required": [
                  "title",
                  "subtitle",
                  "feature_details",
                  "icon",
                  "link",
                  "index",
                  "is_group_child",
                  "group_key",
                  "tooltip",
                  "disabled",
                  "key",
                  "is_new",
                  "is_beta",
                  "is_coming_soon",
                  "should_trigger_upsell_email",
                  "is_trademark",
                  "suppress_tooltip"
                ],
                "type": "object"
              },
              "leads": {
                "properties": {
                  "disabled": {
                    "type": "boolean"
                  },
                  "feature_details": {
                    "type": "string"
                  },
                  "group_key": {
                    "type": "string"
                  },
                  "icon": {
                    "type": "null"
                  },
                  "index": {
                    "type": "integer"
                  },
                  "is_beta": {
                    "type": "boolean"
                  },
                  "is_coming_soon": {
                    "type": "boolean"
                  },
                  "is_group_child": {
                    "type": "boolean"
                  },
                  "is_new": {
                    "type": "boolean"
                  },
                  "is_trademark": {
                    "type": "boolean"
                  },
                  "key": {
                    "type": "null"
                  },
                  "link": {
                    "type": "string"
                  },
                  "should_trigger_upsell_email": {
                    "type": "boolean"
                  },
                  "subtitle": {
                    "type": "null"
                  },
                  "suppress_tooltip": {
                    "type": "boolean"
                  },
                  "title": {
                    "type": "string"
                  },
                  "tooltip": {
                    "type": "null"
                  }
                },
                "required": [
                  "title",
                  "subtitle",
                  "feature_details",
                  "icon",
                  "link",
                  "index",
                  "is_group_child",
                  "group_key",
                  "tooltip",
                  "disabled",
                  "key",
                  "is_new",
                  "is_beta",
                  "is_coming_soon",
                  "should_trigger_upsell_email",
                  "is_trademark",
                  "suppress_tooltip"
                ],
                "type": "object"
              },
              "leads_section": {
                "properties": {
                  "disabled": {
                    "type": "boolean"
                  },
                  "feature_details": {
                    "type": "string"
                  },
                  "group_key": {
                    "type": "string"
                  },
                  "icon": {
                    "type": "null"
                  },
                  "index": {
                    "type": "integer"
                  },
                  "is_beta": {
                    "type": "boolean"
                  },
                  "is_coming_soon": {
                    "type": "boolean"
                  },
                  "is_group_child": {
                    "type": "boolean"
                  },
                  "is_new": {
                    "type": "boolean"
                  },
                  "is_trademark": {
                    "type": "boolean"
                  },
                  "key": {
                    "type": "null"
                  },
                  "link": {
                    "type": "null"
                  },
                  "should_trigger_upsell_email": {
                    "type": "boolean"
                  },
                  "subtitle": {
                    "type": "null"
                  },
                  "suppress_tooltip": {
                    "type": "boolean"
                  },
                  "title": {
                    "type": "string"
                  },
                  "tooltip": {
                    "type": "null"
                  }
                },
                "required": [
                  "title",
                  "subtitle",
                  "feature_details",
                  "icon",
                  "link",
                  "index",
                  "is_group_child",
                  "group_key",
                  "tooltip",
                  "disabled",
                  "key",
                  "is_new",
                  "is_beta",
                  "is_coming_soon",
                  "should_trigger_upsell_email",
                  "is_trademark",
                  "suppress_tooltip"
                ],
                "type": "object"
              },
              "manageleads": {
                "properties": {
                  "disabled": {
                    "type": "boolean"
                  },
                  "feature_details": {
                    "type": "string"
                  },
                  "group_key": {
                    "type": "string"
                  },
                  "icon": {
                    "type": "null"
                  },
                  "index": {
                    "type": "integer"
                  },
                  "is_beta": {
                    "type": "boolean"
                  },
                  "is_coming_soon": {
                    "type": "boolean"
                  },
                  "is_group_child": {
                    "type": "boolean"
                  },
                  "is_new": {
                    "type": "boolean"
                  },
                  "is_trademark": {
                    "type": "boolean"
                  },
                  "key": {
                    "type": "null"
                  },
                  "link": {
                    "type": "string"
                  },
                  "should_trigger_upsell_email": {
                    "type": "boolean"
                  },
                  "subtitle": {
                    "type": "null"
                  },
                  "suppress_tooltip": {
                    "type": "boolean"
                  },
                  "title": {
                    "type": "string"
                  },
                  "tooltip": {
                    "type": "null"
                  }
                },
                "required": [
                  "title",
                  "subtitle",
                  "feature_details",
                  "icon",
                  "link",
                  "index",
                  "is_group_child",
                  "group_key",
                  "tooltip",
                  "disabled",
                  "key",
                  "is_new",
                  "is_beta",
                  "is_coming_soon",
                  "should_trigger_upsell_email",
                  "is_trademark",
                  "suppress_tooltip"
                ],
                "type": "object"
              },
              "report_enhancements": {
                "properties": {
                  "disabled": {
                    "type": "boolean"
                  },
                  "feature_details": {
                    "type": "string"
                  },
                  "group_key": {
                    "type": "string"
                  },
                  "icon": {
                    "type": "null"
                  },
                  "index": {
                    "type": "integer"
                  },
                  "is_beta": {
                    "type": "boolean"
                  },
                  "is_coming_soon": {
                    "type": "boolean"
                  },
                  "is_group_child": {
                    "type": "boolean"
                  },
                  "is_new": {
                    "type": "boolean"
                  },
                  "is_trademark": {
                    "type": "boolean"
                  },
                  "key": {
                    "type": "null"
                  },
                  "link": {
                    "type": "null"
                  },
                  "should_trigger_upsell_email": {
                    "type": "boolean"
                  },
                  "subtitle": {
                    "type": "null"
                  },
                  "suppress_tooltip": {
                    "type": "boolean"
                  },
                  "title": {
                    "type": "string"
                  },
                  "tooltip": {
                    "type": "null"
                  }
                },
                "required": [
                  "title",
                  "subtitle",
                  "feature_details",
                  "icon",
                  "link",
                  "index",
                  "is_group_child",
                  "group_key",
                  "tooltip",
                  "disabled",
                  "key",
                  "is_new",
                  "is_beta",
                  "is_coming_soon",
                  "should_trigger_upsell_email",
                  "is_trademark",
                  "suppress_tooltip"
                ],
                "type": "object"
              },
              "reporting": {
                "properties": {
                  "disabled": {
                    "type": "boolean"
                  },
                  "feature_details": {
                    "type": "string"
                  },
                  "group_key": {
                    "type": "string"
                  },
                  "icon": {
                    "type": "null"
                  },
                  "index": {
                    "type": "integer"
                  },
                  "is_beta": {
                    "type": "boolean"
                  },
                  "is_coming_soon": {
                    "type": "boolean"
                  },
                  "is_group_child": {
                    "type": "boolean"
                  },
                  "is_new": {
                    "type": "boolean"
                  },
                  "is_trademark": {
                    "type": "boolean"
                  },
                  "key": {
                    "type": "null"
                  },
                  "link": {
                    "type": "null"
                  },
                  "should_trigger_upsell_email": {
                    "type": "boolean"
                  },
                  "subtitle": {
                    "type": "null"
                  },
                  "suppress_tooltip": {
                    "type": "boolean"
                  },
                  "title": {
                    "type": "string"
                  },
                  "tooltip": {
                    "type": "null"
                  }
                },
                "required": [
                  "title",
                  "subtitle",
                  "feature_details",
                  "icon",
                  "link",
                  "index",
                  "is_group_child",
                  "group_key",
                  "tooltip",
                  "disabled",
                  "key",
                  "is_new",
                  "is_beta",
                  "is_coming_soon",
                  "should_trigger_upsell_email",
                  "is_trademark",
                  "suppress_tooltip"
                ],
                "type": "object"
              },
              "reportingtemplates": {
                "properties": {
                  "disabled": {
                    "type": "boolean"
                  },
                  "feature_details": {
                    "type": "string"
                  },
                  "group_key": {
                    "type": "string"
                  },
                  "icon": {
                    "type": "null"
                  },
                  "index": {
                    "type": "integer"
                  },
                  "is_beta": {
                    "type": "boolean"
                  },
                  "is_coming_soon": {
                    "type": "boolean"
                  },
                  "is_group_child": {
                    "type": "boolean"
                  },
                  "is_new": {
                    "type": "boolean"
                  },
                  "is_trademark": {
                    "type": "boolean"
                  },
                  "key": {
                    "type": "null"
                  },
                  "link": {
                    "type": "string"
                  },
                  "should_trigger_upsell_email": {
                    "type": "boolean"
                  },
                  "subtitle": {
                    "type": "null"
                  },
                  "suppress_tooltip": {
                    "type": "boolean"
                  },
                  "title": {
                    "type": "string"
                  },
                  "tooltip": {
                    "type": "null"
                  }
                },
                "required": [
                  "title",
                  "subtitle",
                  "feature_details",
                  "icon",
                  "link",
                  "index",
                  "is_group_child",
                  "group_key",
                  "tooltip",
                  "disabled",
                  "key",
                  "is_new",
                  "is_beta",
                  "is_coming_soon",
                  "should_trigger_upsell_email",
                  "is_trademark",
                  "suppress_tooltip"
                ],
                "type": "object"
              },
              "reportscheduler": {
                "properties": {
                  "disabled": {
                    "type": "boolean"
                  },
                  "feature_details": {
                    "type": "string"
                  },
                  "group_key": {
                    "type": "string"
                  },
                  "icon": {
                    "type": "null"
                  },
                  "index": {
                    "type": "integer"
                  },
                  "is_beta": {
                    "type": "boolean"
                  },
                  "is_coming_soon": {
                    "type": "boolean"
                  },
                  "is_group_child": {
                    "type": "boolean"
                  },
                  "is_new": {
                    "type": "boolean"
                  },
                  "is_trademark": {
                    "type": "boolean"
                  },
                  "key": {
                    "type": "null"
                  },
                  "link": {
                    "type": "string"
                  },
                  "should_trigger_upsell_email": {
                    "type": "boolean"
                  },
                  "subtitle": {
                    "type": "null"
                  },
                  "suppress_tooltip": {
                    "type": "boolean"
                  },
                  "title": {
                    "type": "string"
                  },
                  "tooltip": {
                    "type": "null"
                  }
                },
                "required": [
                  "title",
                  "subtitle",
                  "feature_details",
                  "icon",
                  "link",
                  "index",
                  "is_group_child",
                  "group_key",
                  "tooltip",
                  "disabled",
                  "key",
                  "is_new",
                  "is_beta",
                  "is_coming_soon",
                  "should_trigger_upsell_email",
                  "is_trademark",
                  "suppress_tooltip"
                ],
                "type": "object"
              },
              "reportstudio": {
                "properties": {
                  "disabled": {
                    "type": "boolean"
                  },
                  "feature_details": {
                    "type": "string"
                  },
                  "group_key": {
                    "type": "string"
                  },
                  "icon": {
                    "type": "null"
                  },
                  "index": {
                    "type": "integer"
                  },
                  "is_beta": {
                    "type": "boolean"
                  },
                  "is_coming_soon": {
                    "type": "boolean"
                  },
                  "is_group_child": {
                    "type": "boolean"
                  },
                  "is_new": {
                    "type": "boolean"
                  },
                  "is_trademark": {
                    "type": "boolean"
                  },
                  "key": {
                    "type": "null"
                  },
                  "link": {
                    "type": "string"
                  },
                  "should_trigger_upsell_email": {
                    "type": "boolean"
                  },
                  "subtitle": {
                    "type": "null"
                  },
                  "suppress_tooltip": {
                    "type": "boolean"
                  },
                  "title": {
                    "type": "string"
                  },
                  "tooltip": {
                    "type": "null"
                  }
                },
                "required": [
                  "title",
                  "subtitle",
                  "feature_details",
                  "icon",
                  "link",
                  "index",
                  "is_group_child",
                  "group_key",
                  "tooltip",
                  "disabled",
                  "key",
                  "is_new",
                  "is_beta",
                  "is_coming_soon",
                  "should_trigger_upsell_email",
                  "is_trademark",
                  "suppress_tooltip"
                ],
                "type": "object"
              },
              "tags": {
                "properties": {
                  "disabled": {
                    "type": "boolean"
                  },
                  "feature_details": {
                    "type": "string"
                  },
                  "group_key": {
                    "type": "string"
                  },
                  "icon": {
                    "type": "null"
                  },
                  "index": {
                    "type": "integer"
                  },
                  "is_beta": {
                    "type": "boolean"
                  },
                  "is_coming_soon": {
                    "type": "boolean"
                  },
                  "is_group_child": {
                    "type": "boolean"
                  },
                  "is_new": {
                    "type": "boolean"
                  },
                  "is_trademark": {
                    "type": "boolean"
                  },
                  "key": {
                    "type": "null"
                  },
                  "link": {
                    "type": "string"
                  },
                  "should_trigger_upsell_email": {
                    "type": "boolean"
                  },
                  "subtitle": {
                    "type": "null"
                  },
                  "suppress_tooltip": {
                    "type": "boolean"
                  },
                  "title": {
                    "type": "string"
                  },
                  "tooltip": {
                    "type": "null"
                  }
                },
                "required": [
                  "title",
                  "subtitle",
                  "feature_details",
                  "icon",
                  "link",
                  "index",
                  "is_group_child",
                  "group_key",
                  "tooltip",
                  "disabled",
                  "key",
                  "is_new",
                  "is_beta",
                  "is_coming_soon",
                  "should_trigger_upsell_email",
                  "is_trademark",
                  "suppress_tooltip"
                ],
                "type": "object"
              }
            },
            "type": "object"
          },
          "key": {
            "type": "string"
          },
          "subtitle": {
            "type": "string"
          },
          "title": {
            "type": "string"
          }
        },
        "required": [
          "key",
          "index",
          "title",
          "subtitle",
          "icon",
          "items"
        ],
        "type": "object"
      },
      "type": "array"
    },
    "error": {
      "type": "boolean"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": [
    {
      "icon": "favorite-line",
      "index": 1,
      "items": {
        "favorite_dashboard_139": {
          "disabled": false,
          "feature_details": "",
          "group_key": "{redacted}",
          "icon": null,
          "index": 7,
          "is_beta": false,
          "is_coming_soon": false,
          "is_group_child": true,
          "is_new": false,
          "is_trademark": false,
          "key": "{redacted}",
          "link": "fav/dashboards/139",
          "selected_entity": null,
          "should_trigger_upsell_email": true,
          "subtitle": null,
          "suppress_tooltip": false,
          "title": "PJ Métriques - Français",
          "tooltip": null
        },
        "favorite_dashboard_92": {
          "disabled": false,
          "feature_details": "",
          "group_key": "{redacted}",
          "icon": null,
          "index": 8,
          "is_beta": false,
          "is_coming_soon": false,
          "is_group_child": true,
          "is_new": false,
          "is_trademark": false,
          "key": "{redacted}",
          "link": "fav/dashboards/92",
          "selected_entity": null,
          "should_trigger_upsell_email": true,
          "subtitle": null,
          "suppress_tooltip": false,
          "title": "YP Metrics - English",
          "tooltip": null
        },
        "favorites_dashboards": {
          "disabled": false,
          "feature_details": "",
          "group_key": "{redacted}",
          "icon": null,
          "index": 6,
          "is_beta": false,
          "is_coming_soon": false,
          "is_group_child": false,
          "is_new": false,
          "is_trademark": false,
          "key": null,
          "link": null,
          "should_trigger_upsell_email": true,
          "subtitle": null,
          "suppress_tooltip": false,
          "title": "Dashboards",
          "tooltip": null
        }
      },
      "key": "{redacted}",
      "subtitle": "Favorites",
      "title": "Favorites"
    },
    {
      "icon": "report",
      "index": 3,
      "items": {
        "dashboards": {
          "disabled": false,
          "feature_details": "",
          "group_key": "{redacted}",
          "icon": null,
          "index": 37,
          "is_beta": false,
          "is_coming_soon": false,
          "is_group_child": true,
          "is_new": false,
          "is_trademark": false,
          "key": null,
          "link": "dashboards",
          "should_trigger_upsell_email": true,
          "subtitle": null,
          "suppress_tooltip": false,
          "title": "Dashboards",
          "tooltip": null
        },
        "endcustomers": {
          "disabled": false,
          "feature_details": "",
          "group_key": "{redacted}",
          "icon": null,
          "index": 57,
          "is_beta": false,
          "is_coming_soon": false,
          "is_group_child": true,
          "is_new": false,
          "is_trademark": false,
          "key": null,
          "link": "endcustomers",
          "should_trigger_upsell_email": true,
          "subtitle": null,
          "suppress_tooltip": false,
          "title": "End Customers",
          "tooltip": null
        },
        "executivesummaries": {
          "disabled": false,
          "feature_details": "",
          "group_key": "{redacted}",
          "icon": null,
          "index": 46,
          "is_beta": false,
          "is_coming_soon": false,
          "is_group_child": true,
          "is_new": false,
          "is_trademark": false,
          "key": null,
          "link": "executivesummaries",
          "should_trigger_upsell_email": true,
          "subtitle": null,
          "suppress_tooltip": false,
          "title": "Executive Summaries",
          "tooltip": null
        },
        "leads": {
          "disabled": false,
          "feature_details": "Centralize leads from all data sources for easy review and task management.",
          "group_key": "{redacted}",
          "icon": null,
          "index": 55,
          "is_beta": false,
          "is_coming_soon": false,
          "is_group_child": true,
          "is_new": false,
          "is_trademark": false,
          "key": null,
          "link": "leads",
          "should_trigger_upsell_email": true,
          "subtitle": null,
          "suppress_tooltip": false,
          "title": "Leads Dashboard",
          "tooltip": null
        },
        "leads_section": {
          "disabled": false,
          "feature_details": "",
          "group_key": "{redacted}",
          "icon": null,
          "index": 54,
          "is_beta": false,
          "is_coming_soon": false,
          "is_group_child": false,
          "is_new": false,
          "is_trademark": false,
          "key": null,
          "link": null,
          "should_trigger_upsell_email": true,
          "subtitle": null,
          "suppress_tooltip": false,
          "title": "Leads",
          "tooltip": null
        },
        "manageleads": {
          "disabled": false,
          "feature_details": "",
          "group_key": "{redacted}",
          "icon": null,
          "index": 56,
          "is_beta": false,
          "is_coming_soon": false,
          "is_group_child": true,
          "is_new": false,
          "is_trademark": false,
          "key": null,
          "link": "manageleads",
          "should_trigger_upsell_email": true,
          "subtitle": null,
          "suppress_tooltip": false,
          "title": "Manage Leads",
          "tooltip": null
        },
        "report_enhancements": {
          "disabled": false,
          "feature_details": "",
          "group_key": "{redacted}",
          "icon": null,
          "index": 43,
          "is_beta": false,
          "is_coming_soon": false,
          "is_group_child": false,
          "is_new": false,
          "is_trademark": false,
          "key": null,
          "link": null,
          "should_trigger_upsell_email": true,
          "subtitle": null,
          "suppress_tooltip": false,
          "title": "Report Enhancements",
          "tooltip": null
        },
        "reporting": {
          "disabled": false,
          "feature_details": "",
          "group_key": "{redacted}",
          "icon": null,
          "index": 36,
          "is_beta": false,
          "is_coming_soon": false,
          "is_group_child": false,
          "is_new": false,
          "is_trademark": false,
          "key": null,
          "link": null,
          "should_trigger_upsell_email": true,
          "subtitle": null,
          "suppress_tooltip": false,
          "title": "Reporting",
          "tooltip": null
        },
        "reportingtemplates": {
          "disabled": false,
          "feature_details": "",
          "group_key": "{redacted}",
          "icon": null,
          "index": 47,
          "is_beta": false,
          "is_coming_soon": false,
          "is_group_child": true,
          "is_new": false,
          "is_trademark": false,
          "key": null,
          "link": "reportingtemplates",
          "should_trigger_upsell_email": true,
          "subtitle": null,
          "suppress_tooltip": false,
          "title": "Report Covers",
          "tooltip": null
        },
        "reportscheduler": {
          "disabled": false,
          "feature_details": "",
          "group_key": "{redacted}",
          "icon": null,
          "index": 41,
          "is_beta": false,
          "is_coming_soon": false,
          "is_group_child": true,
          "is_new": false,
          "is_trademark": false,
          "key": null,
          "link": "scheduledreports",
          "should_trigger_upsell_email": true,
          "subtitle": null,
          "suppress_tooltip": false,
          "title": "Report Scheduler",
          "tooltip": null
        },
        "reportstudio": {
          "disabled": false,
          "feature_details": "",
          "group_key": "{redacted}",
          "icon": null,
          "index": 39,
          "is_beta": false,
          "is_coming_soon": false,
          "is_group_child": true,
          "is_new": false,
          "is_trademark": false,
          "key": null,
          "link": "reportstudio",
          "should_trigger_upsell_email": true,
          "subtitle": null,
          "suppress_tooltip": false,
          "title": "Report Studio",
          "tooltip": null
        },
        "tags": {
          "disabled": false,
          "feature_details": "",
          "group_key": "{redacted}",
          "icon": null,
          "index": 58,
          "is_beta": false,
          "is_coming_soon": false,
          "is_group_child": true,
          "is_new": false,
          "is_trademark": false,
          "key": null,
          "link": "tags",
          "should_trigger_upsell_email": true,
          "subtitle": null,
          "suppress_tooltip": false,
          "title": "Lead Tags",
          "tooltip": null
        }
      },
      "key": "{redacted}",
      "subtitle": "Reporting & Analytics",
      "title": "Reports"
    }
  ],
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (8)

- `cookie ajs_user_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.userEmail` (seen 1x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 1x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 1x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 1x)
- `cookie ajs_group_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.instanceURL` (seen 1x)
- `cookie SimpleSAMLAuthToken` comes from `POST /simplesaml/module.php/saml/sp/saml2-acs.php/mymetrics_yp_ca_activedirectory_ypcanada` `set-cookie SimpleSAMLAuthToken` (seen 1x)
- `cookie adminhtml` comes from `GET /server/api/branding/mappings` `set-cookie adminhtml` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/categories` `cookie adminhtml`

**Observed in** (1)

- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:35.219Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.787:0`

### `GET /server/api/reportingtemplates`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `all` | query | literal | `true` | no |
| `datatable` | query | literal | `true` | yes |
| `summary` | query | literal | `true` | yes |
| `page` | query | literal | `0,50` | yes |
| `query_id` | query | computed | `e31e20b0-f38c-4aa7-9426-a51afa5021a0` | yes |
| `metadata` | query | literal | `true` | no |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "anyOf": [
        {
          "properties": {
            "aaData": {
              "items": {
                "properties": {
                  "can_be_accessed": {
                    "type": "boolean"
                  },
                  "can_be_copied": {
                    "type": "boolean"
                  },
                  "can_be_deleted": {
                    "type": "boolean"
                  },
                  "can_be_deleted_tooltip": {
                    "type": "null"
                  },
                  "can_be_edited": {
                    "type": "boolean"
                  },
                  "cluster_id": {
                    "type": "null"
                  },
                  "cluster_name": {
                    "type": "null"
                  },
                  "created_at": {
                    "type": "integer"
                  },
                  "formatted_created_at": {
                    "type": "string"
                  },
                  "formatted_updated_at": {
                    "type": "string"
                  },
                  "has_back_page": {
                    "type": "boolean"
                  },
                  "has_cover_page": {
                    "type": "boolean"
                  },
                  "id": {
                    "type": "string"
                  },
                  "name": {
                    "type": "string"
                  },
                  "timegroup": {
                    "type": "string"
                  },
                  "updated_at": {
                    "type": "integer"
                  }
                },
                "required": [
                  "id",
                  "name",
                  "cluster_id",
                  "has_cover_page",
                  "has_back_page",
                  "created_at",
                  "updated_at",
                  "cluster_name",
                  "timegroup",
                  "formatted_created_at",
                  "formatted_updated_at",
                  "can_be_accessed",
                  "can_be_edited",
                  "can_be_deleted",
                  "can_be_copied",
                  "can_be_deleted_tooltip"
                ],
                "type": "object"
              },
              "type": "array"
            },
            "iTotalDisplayRecords": {
              "type": "integer"
            },
            "iTotalRecords": {
              "type": "integer"
            },
            "sEcho": {
              "type": "string"
            }
          },
          "required": [
            "sEcho",
            "iTotalRecords",
            "iTotalDisplayRecords",
            "aaData"
          ],
          "type": "object"
        },
        {
          "type": "array"
        }
      ]
    },
    "error": {
      "type": "boolean"
    },
    "metadata": {
      "properties": {
        "columns": {
          "items": {
            "properties": {
              "allows_null_value": {
                "type": "boolean"
              },
              "audit_name_column": {
                "type": "null"
              },
              "cell_class": {
                "type": "null"
              },
              "concat_columns_split": {
                "type": "string"
              },
              "custom_sort": {
                "type": "null"
              },
              "data_exporter": {
                "type": "boolean"
              },
              "default_sort": {
                "type": "null"
              },
              "details_order": {
                "type": "integer"
              },
              "edit_detail_group_id": {
                "type": "null"
              },
              "enable_history": {
                "type": "boolean"
              },
              "feature_scope": {
                "items": {
                  "type": "string"
                },
                "type": "array"
              },
              "field": {
                "type": "string"
              },
              "filter_input_type": {
                "type": "null"
              },
              "foreign_mapping": {
                "properties": {
                  "clause_conditions": {
                    "items": {
                      "properties": {
                        "clause_operator": {
                          "type": "string"
                        },
                        "condition_operator": {
                          "type": "string"
                        },
                        "foreign_field": {
                          "type": "string"
                        },
                        "source_field": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "source_field",
                        "foreign_field",
                        "condition_operator",
                        "clause_operator"
                      ],
                      "type": "object"
                    },
                    "type": "array"
                  },
                  "default_null_display_value": {
                    "type": "null"
                  },
                  "foreign_dependencies": {
                    "type": "array"
                  },
                  "foreign_entity_field": {
                    "type": "null"
                  },
                  "foreign_entity_route": {
                    "type": "string"
                  },
                  "foreign_expression_fields": {
                    "type": "array"
                  },
                  "foreign_fields": {
                    "properties": {
                      "cluster_name": {
                        "type": "string"
                      }
                    },
                    "required": [
                      "cluster_name"
                    ],
                    "type": "object"
                  },
                  "foreign_is_service_data_table": {
                    "type": "boolean"
                  },
                  "foreign_table_alias": {
                    "type": "null"
                  },
                  "foreign_table_name": {
                    "type": "string"
                  },
                  "foreign_values_route": {
                    "type": "string"
                  },
                  "has_object_mapping": {
                    "type": "boolean"
                  },
                  "intermediary_mappings": {
                    "type": "array"
                  },
                  "is_expression_mapping": {
                    "type": "boolean"
                  },
                  "is_forceful_mapping": {
                    "type": "null"
                  },
                  "is_intermediary_join": {
                    "type": "boolean"
                  },
                  "join_type": {
                    "type": "string"
                  },
                  "object_mapping_fields": {
                    "type": "null"
                  },
                  "object_mapping_key": {
                    "type": "null"
                  },
                  "param_bindings": {
                    "type": "null"
                  },
                  "query_type": {
                    "type": "null"
                  },
                  "source_join_table_name": {
                    "type": "string"
                  },
                  "sub_query_fields": {
                    "type": "null"
                  }
                },
                "required": [
                  "foreign_table_name",
                  "foreign_fields",
                  "foreign_expression_fields",
                  "foreign_table_alias",
                  "foreign_entity_route",
                  "foreign_values_route",
                  "source_join_table_name",
                  "default_null_display_value",
                  "join_type",
                  "clause_conditions",
                  "is_intermediary_join",
                  "is_forceful_mapping",
                  "is_expression_mapping",
                  "has_object_mapping",
                  "intermediary_mappings",
                  "query_type",
                  "object_mapping_key",
                  "object_mapping_fields",
                  "foreign_entity_field",
                  "foreign_is_service_data_table",
                  "param_bindings",
                  "foreign_dependencies",
                  "sub_query_fields"
                ],
                "type": [
                  "object",
                  "null"
                ]
              },
              "foreign_mapping_dependencies": {
                "type": "array"
              },
              "format": {
                "type": "string"
              },
              "has_set_values": {
                "type": "boolean"
              },
              "is_audit_metadata_column": {
                "type": "boolean"
              },
              "is_custom_cell_render": {
                "type": "boolean"
              },
              "is_exportable": {
                "type": "boolean"
              },
              "is_filterable": {
                "type": "boolean"
              },
              "is_foreign_audit_enabled": {
                "type": "boolean"
              },
              "is_foreign_field": {
                "type": "boolean"
              },
              "is_foreign_key": {
                "type": "boolean"
              },
              "is_groupable": {
                "type": "boolean"
              },
              "is_groupby_name_field": {
                "type": "boolean"
              },
              "is_hidden": {
                "type": "boolean"
              },
              "is_metric": {
                "type": "boolean"
              },
              "is_most_recent_value": {
                "type": "boolean"
              },
              "is_primary_key": {
                "type": "boolean"
              },
              "is_primary_name_field": {
                "type": "boolean"
              },
              "is_pseudo": {
                "type": "boolean"
              },
              "is_read_only": {
                "type": "boolean"
              },
              "is_required_in_datatable": {
                "type": "boolean"
              },
              "is_sortable": {
                "type": "boolean"
              },
              "is_taggable": {
                "type": "boolean"
              },
              "label": {
                "type": "string"
              },
              "original_date_format": {
                "type": "null"
              },
              "postprocess_type": {
                "type": "string"
              },
              "precision": {
                "type": "null"
              },
              "sticky": {
                "type": "boolean"
              },
              "summary_dependencies": {
                "type": "array"
              },
              "summary_order": {
                "type": "integer"
              },
              "tooltip": {
                "type": "null"
              },
              "values": {
                "items": {
                  "properties": {
                    "key": {
                      "type": "string"
                    },
                    "value": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "key",
                    "value"
                  ],
                  "type": "object"
                },
                "type": "array"
              },
              "width": {
                "type": "null"
              }
            },
            "required": [
              "field",
              "label",
              "format",
              "values",
              "has_set_values",
              "details_order",
              "summary_order",
              "is_sortable",
              "cell_class",
              "width",
              "custom_sort",
              "default_sort",
              "tooltip",
              "postprocess_type",
              "is_read_only",
              "allows_null_value",
              "is_hidden",
              "is_primary_key",
              "is_primary_name_field",
              "original_date_format",
              "is_foreign_key",
              "is_foreign_field",
              "foreign_mapping",
              "foreign_mapping_dependencies",
              "concat_columns_split",
              "is_pseudo",
              "is_custom_cell_render",
              "is_groupable",
              "is_filterable",
              "sticky",
              "filter_input_type",
              "is_groupby_name_field",
              "is_most_recent_value",
              "is_metric",
              "precision",
              "enable_history",
              "is_taggable",
              "summary_dependencies",
              "edit_detail_group_id",
              "is_exportable",
              "is_required_in_datatable",
              "is_foreign_audit_enabled",
              "audit_name_column",
              "is_audit_metadata_column",
              "data_exporter"
            ],
            "type": "object"
          },
          "type": "array"
        }
      },
      "required": [
        "columns"
      ],
      "type": "object"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": {
    "aaData": [
      {
        "can_be_accessed": true,
        "can_be_copied": false,
        "can_be_deleted": false,
        "can_be_deleted_tooltip": null,
        "can_be_edited": false,
        "cluster_id": null,
        "cluster_name": null,
        "created_at": 1441053871,
        "formatted_created_at": "Aug 31, 2015 4:44 PM",
        "formatted_updated_at": "Aug 31, 2015 4:44 PM",
        "has_back_page": false,
        "has_cover_page": false,
        "id": "1",
        "name": "Default Cover / Back Page",
        "timegroup": "hourly",
        "updated_at": 1441053871
      }
    ],
    "iTotalDisplayRecords": 1,
    "iTotalRecords": 1,
    "sEcho": "prod"
  },
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (12)

- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 2x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 2x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 2x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 2x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 2x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 2x)
- `cookie adminhtml` comes from `storage` `storage cookie[adminhtml]` (seen 1x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 2x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 2x)
- `cookie adminhtml` comes from `GET /server/api/reportingtemplates` `set-cookie adminhtml` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/reportingtemplates` `cookie adminhtml`
- `set-cookie adminhtml` feeds `POST /server/api/reportingtemplates/listusage` `cookie adminhtml`

**Observed in** (2)

- YP Metrics tour, step `open-reportingtemplates`, run `20261104T214824Z-f674`, 2026-11-04T21:51:17.130Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.942:0`
- YP Metrics tour, step `open-reportingtemplates`, run `20261104T214824Z-f674`, 2026-11-04T21:51:17.131Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.943:0`

### `POST /server/api/reportingtemplates/listusage`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

**Request**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "model": {
      "type": "string"
    }
  },
  "required": [
    "model"
  ],
  "type": "object"
}
```

Example:

```json
{
  "model": "{\"ids\":[\"1\"]}"
}
```

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "items": {
        "properties": {
          "can_be_deleted_tooltip": {
            "type": "string"
          },
          "id": {
            "type": "string"
          },
          "in_use": {
            "type": "boolean"
          }
        },
        "required": [
          "id",
          "in_use",
          "can_be_deleted_tooltip"
        ],
        "type": "object"
      },
      "type": "array"
    },
    "error": {
      "type": "boolean"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": [
    {
      "can_be_deleted_tooltip": "This template is used in at least one scheduled report, click on the relationships icon to the left to see where.",
      "id": "1",
      "in_use": true
    }
  ],
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (9)

- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 1x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 1x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 1x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 1x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 1x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 1x)
- `cookie adminhtml` comes from `GET /server/api/reportingtemplates` `set-cookie adminhtml` (seen 1x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 1x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 1x)

**Observed in** (1)

- YP Metrics tour, step `open-reportingtemplates`, run `20261104T214824Z-f674`, 2026-11-04T21:51:17.308Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.945:0`

### `GET /server/api/reportstudio`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `is_predefined` | query | literal | `false` | no |
| `all` | query | literal | `true` | no |
| `datatable` | query | literal | `true` | yes |
| `summary` | query | literal | `true` | yes |
| `sort` | query | literal | `-updated_at` | yes |
| `page` | query | literal | `0,50` | yes |
| `is_in_library` | query | literal | `false` | yes |
| `extra` | query | literal | `true` | yes |
| `query_id` | query | computed | `8ee5a512-2a5d-4875-a849-84d47faaa496` | yes |
| `metadata` | query | literal | `true` | no |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "anyOf": [
        {
          "properties": {
            "aaData": {
              "type": "array"
            },
            "iTotalDisplayRecords": {
              "type": "integer"
            },
            "iTotalRecords": {
              "type": "integer"
            },
            "sEcho": {
              "type": "string"
            }
          },
          "required": [
            "sEcho",
            "iTotalRecords",
            "iTotalDisplayRecords",
            "aaData"
          ],
          "type": "object"
        },
        {
          "type": "array"
        }
      ]
    },
    "error": {
      "type": "boolean"
    },
    "metadata": {
      "properties": {
        "columns": {
          "items": {
            "properties": {
              "allows_null_value": {
                "type": "boolean"
              },
              "audit_name_column": {
                "type": "null"
              },
              "cell_class": {
                "type": "null"
              },
              "concat_columns_split": {
                "type": "string"
              },
              "custom_sort": {
                "type": "null"
              },
              "data_exporter": {
                "type": "boolean"
              },
              "default_sort": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "details_order": {
                "type": "integer"
              },
              "edit_detail_group_id": {
                "type": "null"
              },
              "enable_history": {
                "type": "boolean"
              },
              "field": {
                "type": "string"
              },
              "filter_input_type": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "foreign_mapping": {
                "properties": {
                  "clause_conditions": {
                    "items": {
                      "properties": {
                        "clause_operator": {
                          "type": "string"
                        },
                        "condition_operator": {
                          "type": "string"
                        },
                        "foreign_field": {
                          "type": "string"
                        },
                        "source_field": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "source_field",
                        "foreign_field",
                        "condition_operator",
                        "clause_operator"
                      ],
                      "type": "object"
                    },
                    "type": "array"
                  },
                  "default_null_display_value": {
                    "type": "null"
                  },
                  "foreign_dependencies": {
                    "type": "array"
                  },
                  "foreign_entity_field": {
                    "type": "null"
                  },
                  "foreign_entity_route": {
                    "type": "string"
                  },
                  "foreign_expression_fields": {
                    "anyOf": [
                      {
                        "properties": {
                          "data_sources": {
                            "type": "string"
                          },
                          "is_favorite": {
                            "type": "string"
                          },
                          "is_locked": {
                            "type": "object"
                          }
                        },
                        "type": "object"
                      },
                      {
                        "type": "array"
                      }
                    ]
                  },
                  "foreign_fields": {
                    "properties": {
                      "data_sources": {
                        "type": "string"
                      },
                      "is_favorite": {
                        "type": "string"
                      },
                      "is_locked": {
                        "type": "string"
                      },
                      "user_image_metadata": {
                        "type": "string"
                      }
                    },
                    "type": "object"
                  },
                  "foreign_is_service_data_table": {
                    "type": "boolean"
                  },
                  "foreign_table_alias": {
                    "type": "null"
                  },
                  "foreign_table_name": {
                    "type": "string"
                  },
                  "foreign_values_route": {
                    "type": "string"
                  },
                  "has_object_mapping": {
                    "type": "boolean"
                  },
                  "intermediary_mappings": {
                    "type": "array"
                  },
                  "is_expression_mapping": {
                    "type": "boolean"
                  },
                  "is_forceful_mapping": {
                    "type": "null"
                  },
                  "is_intermediary_join": {
                    "type": "boolean"
                  },
                  "join_type": {
                    "type": "string"
                  },
                  "object_mapping_fields": {
                    "type": "null"
                  },
                  "object_mapping_key": {
                    "type": "null"
                  },
                  "param_bindings": {
                    "type": "null"
                  },
                  "query_type": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "source_join_table_name": {
                    "type": "string"
                  },
                  "sub_query_fields": {
                    "type": "null"
                  }
                },
                "required": [
                  "foreign_table_name",
                  "foreign_fields",
                  "foreign_expression_fields",
                  "foreign_table_alias",
                  "foreign_entity_route",
                  "foreign_values_route",
                  "source_join_table_name",
                  "default_null_display_value",
                  "join_type",
                  "clause_conditions",
                  "is_intermediary_join",
                  "is_forceful_mapping",
                  "is_expression_mapping",
                  "has_object_mapping",
                  "intermediary_mappings",
                  "query_type",
                  "object_mapping_key",
                  "object_mapping_fields",
                  "foreign_entity_field",
                  "foreign_is_service_data_table",
                  "param_bindings",
                  "foreign_dependencies",
                  "sub_query_fields"
                ],
                "type": [
                  "object",
                  "null"
                ]
              },
              "foreign_mapping_dependencies": {
                "type": "array"
              },
              "format": {
                "type": "string"
              },
              "has_set_values": {
                "type": "boolean"
              },
              "is_audit_metadata_column": {
                "type": "boolean"
              },
              "is_custom_cell_render": {
                "type": "boolean"
              },
              "is_exportable": {
                "type": "boolean"
              },
              "is_filterable": {
                "type": "boolean"
              },
              "is_foreign_audit_enabled": {
                "type": "boolean"
              },
              "is_foreign_field": {
                "type": "boolean"
              },
              "is_foreign_key": {
                "type": "boolean"
              },
              "is_groupable": {
                "type": "boolean"
              },
              "is_groupby_name_field": {
                "type": "boolean"
              },
              "is_hidden": {
                "type": "boolean"
              },
              "is_metric": {
                "type": "boolean"
              },
              "is_most_recent_value": {
                "type": "boolean"
              },
              "is_primary_key": {
                "type": "boolean"
              },
              "is_primary_name_field": {
                "type": "boolean"
              },
              "is_pseudo": {
                "type": "boolean"
              },
              "is_read_only": {
                "type": "boolean"
              },
              "is_required_in_datatable": {
                "type": "boolean"
              },
              "is_sortable": {
                "type": "boolean"
              },
              "is_taggable": {
                "type": "boolean"
              },
              "label": {
                "type": "string"
              },
              "original_date_format": {
                "type": "null"
              },
              "postprocess_type": {
                "type": "string"
              },
              "precision": {
                "type": [
                  "integer",
                  "null"
                ]
              },
              "sticky": {
                "type": "boolean"
              },
              "summary_dependencies": {
                "type": "array"
              },
              "summary_order": {
                "type": "integer"
              },
              "tooltip": {
                "type": "null"
              },
              "values": {
                "items": {
                  "properties": {
                    "key": {
                      "type": "string"
                    },
                    "value": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "key",
                    "value"
                  ],
                  "type": "object"
                },
                "type": "array"
              },
              "width": {
                "type": "null"
              }
            },
            "required": [
              "field",
              "label",
              "format",
              "values",
              "has_set_values",
              "details_order",
              "summary_order",
              "is_sortable",
              "cell_class",
              "width",
              "custom_sort",
              "default_sort",
              "tooltip",
              "postprocess_type",
              "is_read_only",
              "allows_null_value",
              "is_hidden",
              "is_primary_key",
              "is_primary_name_field",
              "original_date_format",
              "is_foreign_key",
              "is_foreign_field",
              "foreign_mapping",
              "foreign_mapping_dependencies",
              "concat_columns_split",
              "is_pseudo",
              "is_custom_cell_render",
              "is_groupable",
              "is_filterable",
              "sticky",
              "filter_input_type",
              "is_groupby_name_field",
              "is_most_recent_value",
              "is_metric",
              "precision",
              "enable_history",
              "is_taggable",
              "summary_dependencies",
              "edit_detail_group_id",
              "is_exportable",
              "is_required_in_datatable",
              "is_foreign_audit_enabled",
              "audit_name_column",
              "is_audit_metadata_column",
              "data_exporter"
            ],
            "type": "object"
          },
          "type": "array"
        }
      },
      "required": [
        "columns"
      ],
      "type": "object"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": {
    "aaData": [],
    "iTotalDisplayRecords": 0,
    "iTotalRecords": 0,
    "sEcho": "prod"
  },
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (12)

- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 2x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 2x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 2x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 2x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 2x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 2x)
- `cookie adminhtml` comes from `GET /server/api/users/{userId}/listsettings` `set-cookie adminhtml` (seen 1x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 2x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 2x)
- `cookie adminhtml` comes from `GET /server/api/reportstudio` `set-cookie adminhtml` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/reportstudio` `cookie adminhtml`
- `set-cookie adminhtml` feeds `POST /server/api/reportstudio/listusage` `cookie adminhtml`

**Observed in** (2)

- YP Metrics tour, step `open-reportstudio`, run `20261104T214824Z-f674`, 2026-11-04T21:50:12.478Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.912:0`
- YP Metrics tour, step `open-reportstudio`, run `20261104T214824Z-f674`, 2026-11-04T21:50:12.478Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.913:0`

### `POST /server/api/reportstudio/listusage`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

**Request**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "model": {
      "type": "string"
    }
  },
  "required": [
    "model"
  ],
  "type": "object"
}
```

Example:

```json
{
  "model": "{\"ids\":[]}"
}
```

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "type": "array"
    },
    "error": {
      "type": "boolean"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": [],
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (9)

- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 1x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 1x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 1x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 1x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 1x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 1x)
- `cookie adminhtml` comes from `GET /server/api/reportstudio` `set-cookie adminhtml` (seen 1x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 1x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 1x)

**Observed in** (1)

- YP Metrics tour, step `open-reportstudio`, run `20261104T214824Z-f674`, 2026-11-04T21:50:12.742Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.916:0`

### `GET /server/api/scheduledreports`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `all` | query | literal | `true` | no |
| `datatable` | query | literal | `true` | yes |
| `summary` | query | literal | `true` | yes |
| `page` | query | literal | `0,50` | yes |
| `status` | query | binding | `active` | yes |
| `query_id` | query | computed | `16ca553b-51f1-47b5-99b6-1cb585852fc4` | yes |
| `metadata` | query | literal | `true` | no |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "anyOf": [
        {
          "properties": {
            "aaData": {
              "type": "array"
            },
            "iTotalDisplayRecords": {
              "type": "integer"
            },
            "iTotalRecords": {
              "type": "integer"
            },
            "sEcho": {
              "type": "string"
            }
          },
          "required": [
            "sEcho",
            "iTotalRecords",
            "iTotalDisplayRecords",
            "aaData"
          ],
          "type": "object"
        },
        {
          "type": "array"
        }
      ]
    },
    "error": {
      "type": "boolean"
    },
    "metadata": {
      "properties": {
        "columns": {
          "items": {
            "properties": {
              "allows_null_value": {
                "type": "boolean"
              },
              "audit_name_column": {
                "type": "null"
              },
              "cell_class": {
                "type": "null"
              },
              "concat_columns_split": {
                "type": "string"
              },
              "custom_sort": {
                "type": "null"
              },
              "data_exporter": {
                "type": "boolean"
              },
              "default_sort": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "details_order": {
                "type": "integer"
              },
              "edit_detail_group_id": {
                "type": "null"
              },
              "enable_history": {
                "type": "boolean"
              },
              "field": {
                "type": "string"
              },
              "filter_input_type": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "foreign_mapping": {
                "properties": {
                  "clause_conditions": {
                    "items": {
                      "properties": {
                        "clause_operator": {
                          "type": "string"
                        },
                        "condition_operator": {
                          "type": "string"
                        },
                        "foreign_field": {
                          "type": "string"
                        },
                        "source_field": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "source_field",
                        "foreign_field",
                        "condition_operator",
                        "clause_operator"
                      ],
                      "type": "object"
                    },
                    "type": "array"
                  },
                  "default_null_display_value": {
                    "type": "null"
                  },
                  "foreign_dependencies": {
                    "type": "array"
                  },
                  "foreign_entity_field": {
                    "type": "null"
                  },
                  "foreign_entity_route": {
                    "type": "string"
                  },
                  "foreign_expression_fields": {
                    "anyOf": [
                      {
                        "type": "array"
                      },
                      {
                        "properties": {
                          "scheduled_report_user_emails": {
                            "type": "string"
                          }
                        },
                        "required": [
                          "scheduled_report_user_emails"
                        ],
                        "type": "object"
                      }
                    ]
                  },
                  "foreign_fields": {
                    "properties": {
                      "client_name": {
                        "type": "string"
                      },
                      "cluster_name": {
                        "type": "string"
                      },
                      "scheduled_report_user_emails": {
                        "type": "string"
                      },
                      "smart_campaign_client_id": {
                        "type": "string"
                      },
                      "smart_campaign_name": {
                        "type": "string"
                      }
                    },
                    "type": "object"
                  },
                  "foreign_is_service_data_table": {
                    "type": "boolean"
                  },
                  "foreign_table_alias": {
                    "type": "null"
                  },
                  "foreign_table_name": {
                    "type": "string"
                  },
                  "foreign_values_route": {
                    "type": "string"
                  },
                  "has_object_mapping": {
                    "type": "boolean"
                  },
                  "intermediary_mappings": {
                    "items": {
                      "properties": {
                        "clause_conditions": {
                          "items": {
                            "type": "object"
                          },
                          "type": "array"
                        },
                        "default_null_display_value": {
                          "type": "null"
                        },
                        "foreign_dependencies": {
                          "type": "array"
                        },
                        "foreign_entity_field": {
                          "type": "null"
                        },
                        "foreign_entity_route": {
                          "type": "string"
                        },
                        "foreign_expression_fields": {
                          "type": "array"
                        },
                        "foreign_fields": {
                          "type": "array"
                        },
                        "foreign_is_service_data_table": {
                          "type": "boolean"
                        },
                        "foreign_table_alias": {
                          "type": "null"
                        },
                        "foreign_table_name": {
                          "type": "string"
                        },
                        "foreign_values_route": {
                          "type": "string"
                        },
                        "has_object_mapping": {
                          "type": "boolean"
                        },
                        "intermediary_mappings": {
                          "type": "array"
                        },
                        "is_expression_mapping": {
                          "type": "boolean"
                        },
                        "is_forceful_mapping": {
                          "type": "null"
                        },
                        "is_intermediary_join": {
                          "type": "boolean"
                        },
                        "join_type": {
                          "type": "string"
                        },
                        "object_mapping_fields": {
                          "type": "null"
                        },
                        "object_mapping_key": {
                          "type": "null"
                        },
                        "param_bindings": {
                          "type": "null"
                        },
                        "query_type": {
                          "type": "null"
                        },
                        "source_join_table_name": {
                          "type": "string"
                        },
                        "sub_query_fields": {
                          "type": "null"
                        }
                      },
                      "required": [
                        "foreign_table_name",
                        "foreign_fields",
                        "foreign_expression_fields",
                        "foreign_table_alias",
                        "foreign_entity_route",
                        "foreign_values_route",
                        "source_join_table_name",
                        "default_null_display_value",
                        "join_type",
                        "clause_conditions",
                        "is_intermediary_join",
                        "is_forceful_mapping",
                        "is_expression_mapping",
                        "has_object_mapping",
                        "intermediary_mappings",
                        "query_type",
                        "object_mapping_key",
                        "object_mapping_fields",
                        "foreign_entity_field",
                        "foreign_is_service_data_table",
                        "param_bindings",
                        "foreign_dependencies",
                        "sub_query_fields"
                      ],
                      "type": "object"
                    },
                    "type": "array"
                  },
                  "is_expression_mapping": {
                    "type": "boolean"
                  },
                  "is_forceful_mapping": {
                    "type": "null"
                  },
                  "is_intermediary_join": {
                    "type": "boolean"
                  },
                  "join_type": {
                    "type": "string"
                  },
                  "object_mapping_fields": {
                    "type": "null"
                  },
                  "object_mapping_key": {
                    "type": "null"
                  },
                  "param_bindings": {
                    "type": "null"
                  },
                  "query_type": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "source_join_table_name": {
                    "type": "string"
                  },
                  "sub_query_fields": {
                    "type": "null"
                  }
                },
                "required": [
                  "foreign_table_name",
                  "foreign_fields",
                  "foreign_expression_fields",
                  "foreign_table_alias",
                  "foreign_entity_route",
                  "foreign_values_route",
                  "source_join_table_name",
                  "default_null_display_value",
                  "join_type",
                  "clause_conditions",
                  "is_intermediary_join",
                  "is_forceful_mapping",
                  "is_expression_mapping",
                  "has_object_mapping",
                  "intermediary_mappings",
                  "query_type",
                  "object_mapping_key",
                  "object_mapping_fields",
                  "foreign_entity_field",
                  "foreign_is_service_data_table",
                  "param_bindings",
                  "foreign_dependencies",
                  "sub_query_fields"
                ],
                "type": [
                  "object",
                  "null"
                ]
              },
              "foreign_mapping_dependencies": {
                "type": "array"
              },
              "format": {
                "type": "string"
              },
              "has_set_values": {
                "type": "boolean"
              },
              "is_audit_metadata_column": {
                "type": "boolean"
              },
              "is_custom_cell_render": {
                "type": "boolean"
              },
              "is_exportable": {
                "type": "boolean"
              },
              "is_filterable": {
                "type": "boolean"
              },
              "is_foreign_audit_enabled": {
                "type": "boolean"
              },
              "is_foreign_field": {
                "type": "boolean"
              },
              "is_foreign_key": {
                "type": "boolean"
              },
              "is_groupable": {
                "type": "boolean"
              },
              "is_groupby_name_field": {
                "type": "boolean"
              },
              "is_hidden": {
                "type": "boolean"
              },
              "is_metric": {
                "type": "boolean"
              },
              "is_most_recent_value": {
                "type": "boolean"
              },
              "is_primary_key": {
                "type": "boolean"
              },
              "is_primary_name_field": {
                "type": "boolean"
              },
              "is_pseudo": {
                "type": "boolean"
              },
              "is_read_only": {
                "type": "boolean"
              },
              "is_required_in_datatable": {
                "type": "boolean"
              },
              "is_sortable": {
                "type": "boolean"
              },
              "is_taggable": {
                "type": "boolean"
              },
              "label": {
                "type": "string"
              },
              "original_date_format": {
                "type": "null"
              },
              "postprocess_type": {
                "type": "string"
              },
              "precision": {
                "type": "null"
              },
              "sticky": {
                "type": "boolean"
              },
              "summary_dependencies": {
                "type": "array"
              },
              "summary_order": {
                "type": "integer"
              },
              "tooltip": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "values": {
                "items": {
                  "properties": {
                    "key": {
                      "type": "string"
                    },
                    "tooltip": {
                      "type": [
                        "string",
                        "null"
                      ]
                    },
                    "value": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "key",
                    "value"
                  ],
                  "type": "object"
                },
                "type": "array"
              },
              "width": {
                "type": "null"
              }
            },
            "required": [
              "field",
              "label",
              "format",
              "values",
              "has_set_values",
              "details_order",
              "summary_order",
              "is_sortable",
              "cell_class",
              "width",
              "custom_sort",
              "default_sort",
              "tooltip",
              "postprocess_type",
              "is_read_only",
              "allows_null_value",
              "is_hidden",
              "is_primary_key",
              "is_primary_name_field",
              "original_date_format",
              "is_foreign_key",
              "is_foreign_field",
              "foreign_mapping",
              "foreign_mapping_dependencies",
              "concat_columns_split",
              "is_pseudo",
              "is_custom_cell_render",
              "is_groupable",
              "is_filterable",
              "sticky",
              "filter_input_type",
              "is_groupby_name_field",
              "is_most_recent_value",
              "is_metric",
              "precision",
              "enable_history",
              "is_taggable",
              "summary_dependencies",
              "edit_detail_group_id",
              "is_exportable",
              "is_required_in_datatable",
              "is_foreign_audit_enabled",
              "audit_name_column",
              "is_audit_metadata_column",
              "data_exporter"
            ],
            "type": "object"
          },
          "type": "array"
        }
      },
      "required": [
        "columns"
      ],
      "type": "object"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": {
    "aaData": [],
    "iTotalDisplayRecords": 0,
    "iTotalRecords": 0,
    "sEcho": "prod"
  },
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (12)

- `query status` comes from `GET /server/api/session/initUser` `response.body $.data.settings.instanceStatus` (seen 2x)
- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 2x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 2x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 2x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 2x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 2x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 2x)
- `cookie adminhtml` comes from `storage` `storage cookie[adminhtml]` (seen 1x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 2x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 2x)
- `cookie adminhtml` comes from `GET /server/api/scheduledreports` `set-cookie adminhtml` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/scheduledreports` `cookie adminhtml`

**Observed in** (2)

- YP Metrics tour, step `open-scheduledreports`, run `20261104T214824Z-f674`, 2026-11-04T21:50:34.049Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.924:0`
- YP Metrics tour, step `open-scheduledreports`, run `20261104T214824Z-f674`, 2026-11-04T21:50:34.050Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.925:0`

### `GET /server/api/services`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `all` | query | literal | `true` | yes |
| `query_id` | query | computed | `3303741a-1c5f-42c1-8b3b-965a3453caa0` | yes |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "items": {
        "properties": {
          "active": {
            "type": "boolean"
          },
          "active_in_development": {
            "type": "boolean"
          },
          "active_in_production": {
            "type": "boolean"
          },
          "api": {
            "type": "string"
          },
          "avg": {
            "type": "string"
          },
          "can_be_accessed": {
            "type": "boolean"
          },
          "can_be_copied": {
            "type": "boolean"
          },
          "can_be_deleted": {
            "type": "boolean"
          },
          "can_be_deleted_tooltip": {
            "type": "null"
          },
          "can_be_edited": {
            "type": "boolean"
          },
          "child_of_service_id": {
            "type": [
              "string",
              "null"
            ]
          },
          "color": {
            "type": "string"
          },
          "confluence_url": {
            "format": "uri",
            "type": [
              "string",
              "null"
            ]
          },
          "connector_marketplace_url": {
            "format": "uri",
            "type": [
              "string",
              "null"
            ]
          },
          "custom_color": {
            "type": "null"
          },
          "custom_icon": {
            "type": [
              "string",
              "null"
            ]
          },
          "data_connection_type": {
            "type": "integer"
          },
          "datamodel": {
            "type": "string"
          },
          "has_connected": {
            "type": "boolean"
          },
          "has_customer_assignments": {
            "type": "boolean"
          },
          "has_live_integration": {
            "type": "boolean"
          },
          "has_margin": {
            "type": "boolean"
          },
          "has_stored_data": {
            "type": "boolean"
          },
          "is_connected": {
            "type": "boolean"
          },
          "is_tap_optimize_enabled": {
            "type": "null"
          },
          "label": {
            "type": "string"
          },
          "live_advanced_calculation_enabled": {
            "type": "boolean"
          },
          "live_assignments_threshold": {
            "type": [
              "integer",
              "null"
            ]
          },
          "mapbox_config": {
            "type": "array"
          },
          "model": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "no_sub_item_message": {
            "type": "string"
          },
          "notice_text": {
            "type": "string"
          },
          "oauth_type": {
            "type": [
              "integer",
              "null"
            ]
          },
          "original_name": {
            "type": "string"
          },
          "parsemodel": {
            "type": "string"
          },
          "preferred": {
            "type": "string"
          },
          "service_icon": {
            "type": "string"
          },
          "service_id": {
            "type": "string"
          },
          "show_sub_accounts": {
            "type": "boolean"
          },
          "sort_order": {
            "type": "string"
          },
          "trend": {
            "type": "string"
          },
          "type": {
            "items": {
              "type": "string"
            },
            "type": "array"
          },
          "use_id": {
            "type": "string"
          },
          "use_oauth": {
            "type": "string"
          }
        },
        "required": [
          "service_id",
          "name",
          "original_name",
          "datamodel",
          "parsemodel",
          "api",
          "use_id",
          "use_oauth",
          "label",
          "model",
          "avg",
          "trend",
          "sort_order",
          "active",
          "active_in_development",
          "active_in_production",
          "has_margin",
          "color",
          "custom_color",
          "custom_icon",
          "child_of_service_id",
          "preferred",
          "has_live_integration",
          "has_stored_data",
          "connector_marketplace_url",
          "confluence_url",
          "is_connected",
          "has_customer_assignments",
          "service_icon",
          "data_connection_type",
          "no_sub_item_message",
          "has_connected",
          "show_sub_accounts",
          "live_assignments_threshold",
          "is_tap_optimize_enabled",
          "live_advanced_calculation_enabled",
          "mapbox_config",
          "notice_text",
          "type",
          "oauth_type",
          "can_be_accessed",
          "can_be_edited",
          "can_be_deleted",
          "can_be_copied",
          "can_be_deleted_tooltip"
        ],
        "type": "object"
      },
      "type": "array"
    },
    "error": {
      "type": "boolean"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": [
    {
      "active": true,
      "active_in_development": true,
      "active_in_production": true,
      "api": "1",
      "avg": "0",
      "can_be_accessed": true,
      "can_be_copied": false,
      "can_be_deleted": false,
      "can_be_deleted_tooltip": null,
      "can_be_edited": false,
      "child_of_service_id": null,
      "color": "#3498db",
      "confluence_url": null,
      "connector_marketplace_url": null,
      "custom_color": null,
      "custom_icon": "icon-info-circle",
      "data_connection_type": 1,
      "datamodel": "info/genericcgn",
      "has_connected": true,
      "has_customer_assignments": true,
      "has_live_integration": false,
      "has_margin": false,
      "has_stored_data": true,
      "is_connected": true,
      "is_tap_optimize_enabled": null,
      "label": "",
      "live_advanced_calculation_enabled": false,
      "live_assignments_threshold": null,
      "mapbox_config": [],
      "model": "default",
      "name": "Advertiser Product Portfolio",
      "no_sub_item_message": "No campaigns found",
      "notice_text": "",
      "oauth_type": 2,
      "original_name": "Advertiser Product Portfolio",
      "parsemodel": "fetcher/vendor_generic_parser",
      "preferred": "0",
      "service_icon": "custom-icon icon-info-circle",
      "service_id": "1000028",
      "show_sub_accounts": false,
      "sort_order": "0",
      "trend": "0",
      "type": [],
      "use_id": "0",
      "use_oauth": "{redacted}"
    },
    {
      "active": true,
      "active_in_development": true,
      "active_in_production": true,
      "api": "1",
      "avg": "0",
      "can_be_accessed": true,
      "can_be_copied": false,
      "can_be_deleted": false,
      "can_be_deleted_tooltip": null,
      "can_be_edited": false,
      "child_of_service_id": null,
      "color": "#3498db",
      "confluence_url": null,
      "connector_marketplace_url": null,
      "custom_color": null,
      "custom_icon": "icon-info-circle",
      "data_connection_type": 1,
      "datamodel": "info/genericcgn",
      "has_connected": true,
      "has_customer_assignments": true,
      "has_live_integration": false,
      "has_margin": false,
      "has_stored_data": true,
      "is_connected": true,
      "is_tap_optimize_enabled": null,
      "label": "",
      "live_advanced_calculation_enabled": false,
      "live_assignments_threshold": null,
      "mapbox_config": [],
      "model": "default",
      "name": "Advertiser Product Portfolio French",
      "no_sub_item_message": "No campaigns found",
      "notice_text": "",
      "oauth_type": 2,
      "original_name": "Advertiser Product Portfolio French",
      "parsemodel": "fetcher/vendor_generic_parser",
      "preferred": "0",
      "service_icon": "custom-icon icon-info-circle",
      "service_id": "1000038",
      "show_sub_accounts": false,
      "sort_order": "0",
      "trend": "0",
      "type": [],
      "use_id": "0",
      "use_oauth": "{redacted}"
    }
  ],
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (15)

- `cookie ajs_user_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.userEmail` (seen 1x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 4x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 4x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 4x)
- `cookie ajs_group_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.instanceURL` (seen 1x)
- `cookie SimpleSAMLAuthToken` comes from `POST /simplesaml/module.php/saml/sp/saml2-acs.php/mymetrics_yp_ca_activedirectory_ypcanada` `set-cookie SimpleSAMLAuthToken` (seen 1x)
- `cookie adminhtml` comes from `GET /server/api/categories` `set-cookie adminhtml` (seen 3x)
- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 3x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 3x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 3x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 3x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 3x)
- `cookie adminhtml` comes from `GET /server/api/admin/manageleads` `set-cookie adminhtml` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/dash/pages/isleads/{isleadId}` `cookie adminhtml`
- `set-cookie adminhtml` feeds `GET /server/api/leads` `cookie adminhtml`

**Observed in** (4)

- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:35.304Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.789:0`
- YP Metrics tour, step `open-fav-dashboards-92`, run `20261104T214824Z-f674`, 2026-11-04T21:49:30.153Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.852:0`
- YP Metrics tour, step `open-leads`, run `20261104T214824Z-f674`, 2026-11-04T21:51:38.992Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.955:0`
- YP Metrics tour, step `open-manageleads`, run `20261104T214824Z-f674`, 2026-11-04T21:52:00.398Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.969:0`

### `GET /server/api/services/{serviceId}/data/adgroup`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `serviceId` | path | literal | `34` | yes |
| `query_id` | query | computed | `ece6bfc7-5dce-4f91-9902-8d24a93b69ff` | unknown |
| `daterange` | query | literal | `2026-10-28\|2026-11-03` | unknown |
| `filter_set_id` | query | binding | `5338` | unknown |
| `fields` | query | literal | `name,ImpressionCount,ClickCount,CTR,AverageCPC,SpendCount,name` | unknown |
| `aggregate` | query | literal | `false` | unknown |
| `datatable` | query | literal | `true` | unknown |
| `page` | query | literal | `0,10` | unknown |
| `sort` | query | literal | `-ClickCount` | unknown |
| `groupby` | query | binding | `adgroup_id` | unknown |
| `widget_request` | query | binding | `46783` | unknown |
| `widget_type` | query | binding | `datagrid` | unknown |
| `widget_page_id` | query | literal | `92` | unknown |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "properties": {
        "aaData": {
          "items": {
            "properties": {
              "AverageCPC": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "CTR": {
                "type": "string"
              },
              "ClickCount": {
                "type": "string"
              },
              "ImpressionCount": {
                "type": "string"
              },
              "SpendCount": {
                "type": "string"
              },
              "adgroup_id": {
                "type": "string"
              },
              "advertising_channel_type": {
                "type": "string"
              },
              "calculation_277": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "network": {
                "type": "string"
              },
              "reporting_status_display": {
                "type": "null"
              }
            },
            "required": [
              "adgroup_id",
              "name",
              "ImpressionCount",
              "ClickCount",
              "CTR",
              "AverageCPC",
              "SpendCount",
              "calculation_277",
              "network",
              "advertising_channel_type",
              "reporting_status_display"
            ],
            "type": "object"
          },
          "type": "array"
        },
        "iTotalDisplayRecords": {
          "type": "integer"
        },
        "iTotalRecords": {
          "type": "integer"
        },
        "sEcho": {
          "type": "string"
        }
      },
      "required": [
        "sEcho",
        "iTotalRecords",
        "iTotalDisplayRecords",
        "aaData"
      ],
      "type": "object"
    },
    "error": {
      "type": "boolean"
    },
    "query_id": {
      "format": "uuid",
      "type": "string"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "query_id",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": {
    "aaData": [
      {
        "AverageCPC": "9.014444444",
        "CTR": "4.054054054",
        "ClickCount": "9",
        "ImpressionCount": "222",
        "SpendCount": "81.130000000",
        "adgroup_id": "40002257",
        "advertising_channel_type": "SEARCH",
        "calculation_277": "Google Search",
        "name": "Residential Roofing",
        "network": "SEARCH",
        "reporting_status_display": null
      },
      {
        "AverageCPC": "7.556666667",
        "CTR": "11.111111111",
        "ClickCount": "9",
        "ImpressionCount": "81",
        "SpendCount": "68.010000000",
        "adgroup_id": "40002259",
        "advertising_channel_type": "SEARCH",
        "calculation_277": "Google Search",
        "name": "Roof Repair Services",
        "network": "SEARCH",
        "reporting_status_display": null
      }
    ],
    "iTotalDisplayRecords": 3,
    "iTotalRecords": 3,
    "sEcho": "prod"
  },
  "error": false,
  "query_id": "ece6bfc7-5dce-4f91-9902-8d24a93b69ff",
  "status": 200,
  "warnings": []
}
```

**Bindings** (14)

- `query filter_set_id` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.2267.widgets.46783.metadata.filter_set_id` (seen 1x)
- `query groupby` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.2267.widgets.46783.metadata.data_columns.selected[0].groupby_id_field` (seen 1x)
- `query widget_request` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[173]` (seen 1x)
- `query widget_type` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.2267.widgets.40735.type` (seen 1x)
- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 1x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 1x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 1x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 1x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 1x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 1x)
- `cookie adminhtml` comes from `GET /server/api/categories/{categoryId}/data/{dataId}` `set-cookie adminhtml` (seen 1x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 1x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/services/{serviceId}/data/city` `cookie adminhtml`

**Observed in** (1)

- YP Metrics tour, step `tab-sem`, run `20261104T214824Z-f674`, 2026-11-04T21:55:00.025Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1158:0`

### `GET /server/api/services/{serviceId}/data/adgroupcgn`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `serviceId` | path | literal | `39` | yes |
| `query_id` | query | computed | `4aba52c1-2930-44ae-91c7-f759fff5ed38` | yes |
| `daterange` | query | literal | `2026-10-28\|2026-11-03` | yes |
| `fields` | query | literal | `name,objective_campaign,adset_start_date,adset_end_date,creative_links,AdPreviewURL,AdMobilePreviewURL,AvgreachCount,AvgfrequencyCount,ImpressionCount,CpmCount,Inline_link_clickCount,CpcLinkCount,CtrLinkCount,calculation_151,Video_viewsCount,name` | yes |
| `aggregate` | query | literal | `false` | yes |
| `datatable` | query | literal | `true` | yes |
| `page` | query | literal | `0,10` | yes |
| `sort` | query | literal | `-ImpressionCount` | yes |
| `groupby` | query | literal | `adgroup_id,objective_campaign,adset_start_date,adset_end_date` | yes |
| `total` | query | literal | `true` | yes |
| `widget_request` | query | binding | `29434` | yes |
| `widget_type` | query | binding | `datagrid` | yes |
| `widget_page_id` | query | literal | `92` | yes |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "properties": {
        "aaData": {
          "items": {
            "properties": {
              "AdMobilePreviewURL": {
                "type": "string"
              },
              "AdPreviewURL": {
                "type": "string"
              },
              "AvgfrequencyCount": {
                "type": "string"
              },
              "AvgreachCount": {
                "type": "string"
              },
              "CpcLinkCount": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "CpmCount": {
                "type": "string"
              },
              "CtrLinkCount": {
                "type": "string"
              },
              "ImpressionCount": {
                "type": "string"
              },
              "Inline_link_clickCount": {
                "type": "string"
              },
              "Offsite_leadCount": {
                "type": "string"
              },
              "On_facebook_leadsCount": {
                "type": "string"
              },
              "Video_viewsCount": {
                "type": "string"
              },
              "adgroup_id": {
                "type": "string"
              },
              "adset_end_date": {
                "type": "integer"
              },
              "adset_start_date": {
                "type": "integer"
              },
              "calculation_151": {
                "type": "integer"
              },
              "connection_id_for_preview": {
                "type": "string"
              },
              "creative_links": {
                "type": "string"
              },
              "facebook_adgroup_id": {
                "type": "string"
              },
              "facebook_positions": {
                "type": "string"
              },
              "formatted_adset_end_date": {
                "type": "string"
              },
              "formatted_adset_start_date": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "objective_campaign": {
                "type": "string"
              },
              "preview_url": {
                "type": "null"
              },
              "reporting_status_display": {
                "type": "null"
              },
              "targeting_instagram_positions": {
                "type": "string"
              },
              "targeting_publisher_platforms": {
                "type": "string"
              },
              "timegroup": {
                "type": "string"
              }
            },
            "required": [
              "adgroup_id",
              "name",
              "AdPreviewURL",
              "AdMobilePreviewURL",
              "AvgreachCount",
              "AvgfrequencyCount",
              "ImpressionCount",
              "CpmCount",
              "Inline_link_clickCount",
              "CpcLinkCount",
              "CtrLinkCount",
              "calculation_151",
              "Video_viewsCount",
              "connection_id_for_preview",
              "preview_url",
              "facebook_adgroup_id",
              "targeting_publisher_platforms",
              "facebook_positions",
              "targeting_instagram_positions",
              "On_facebook_leadsCount",
              "Offsite_leadCount",
              "adset_start_date",
              "adset_end_date",
              "objective_campaign",
              "creative_links",
              "timegroup",
              "formatted_adset_end_date",
              "formatted_adset_start_date",
              "reporting_status_display"
            ],
            "type": "object"
          },
          "type": "array"
        },
        "iTotalDisplayRecords": {
          "type": "integer"
        },
        "iTotalRecords": {
          "type": "integer"
        },
        "sEcho": {
          "type": "string"
        }
      },
      "required": [
        "sEcho",
        "iTotalRecords",
        "iTotalDisplayRecords",
        "aaData"
      ],
      "type": "object"
    },
    "error": {
      "type": "boolean"
    },
    "query_id": {
      "format": "uuid",
      "type": "string"
    },
    "status": {
      "type": "integer"
    },
    "total_data": {
      "items": {
        "properties": {
          "AdMobilePreviewURL": {
            "type": "string"
          },
          "AdPreviewURL": {
            "type": "string"
          },
          "AvgfrequencyCount": {
            "type": "string"
          },
          "AvgreachCount": {
            "type": "string"
          },
          "CpcLinkCount": {
            "type": "string"
          },
          "CpmCount": {
            "type": "string"
          },
          "CtrLinkCount": {
            "type": "string"
          },
          "ImpressionCount": {
            "type": "string"
          },
          "Inline_link_clickCount": {
            "type": "string"
          },
          "Offsite_leadCount": {
            "type": "string"
          },
          "On_facebook_leadsCount": {
            "type": "string"
          },
          "Video_viewsCount": {
            "type": "string"
          },
          "account_id": {
            "type": "string"
          },
          "account_name": {
            "type": "string"
          },
          "adgroup_id": {
            "type": "string"
          },
          "adset_end_date": {
            "type": "integer"
          },
          "adset_name": {
            "type": "string"
          },
          "adset_start_date": {
            "type": "integer"
          },
          "billing_event": {
            "type": "string"
          },
          "body": {
            "type": "string"
          },
          "buying_type": {
            "type": "string"
          },
          "calculation_151": {
            "type": "integer"
          },
          "campaign_customer_id": {
            "type": "string"
          },
          "campaign_id": {
            "type": "string"
          },
          "campaign_name": {
            "type": "string"
          },
          "connection_id_for_preview": {
            "type": "string"
          },
          "creative_links": {
            "type": "string"
          },
          "creative_thumbs": {
            "format": "uri",
            "type": "string"
          },
          "facebook_adgroup_id": {
            "type": "string"
          },
          "facebook_adset_id": {
            "type": "string"
          },
          "facebook_adset_status": {
            "type": "string"
          },
          "facebook_positions": {
            "type": "string"
          },
          "formatted_adset_end_date": {
            "type": "string"
          },
          "formatted_adset_start_date": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "objective_campaign": {
            "type": "string"
          },
          "optimization_goal": {
            "type": "string"
          },
          "preview_url": {
            "type": "null"
          },
          "reporting_status_display": {
            "type": "null"
          },
          "targeting_instagram_positions": {
            "type": "string"
          },
          "targeting_publisher_platforms": {
            "type": "string"
          },
          "timegroup": {
            "type": "string"
          }
        },
        "required": [
          "adgroup_id",
          "name",
          "AdPreviewURL",
          "AdMobilePreviewURL",
          "AvgreachCount",
          "AvgfrequencyCount",
          "ImpressionCount",
          "CpmCount",
          "Inline_link_clickCount",
          "CpcLinkCount",
          "CtrLinkCount",
          "calculation_151",
          "Video_viewsCount",
          "connection_id_for_preview",
          "preview_url",
          "facebook_adgroup_id",
          "targeting_publisher_platforms",
          "facebook_positions",
          "targeting_instagram_positions",
          "On_facebook_leadsCount",
          "Offsite_leadCount",
          "adset_start_date",
          "adset_end_date",
          "objective_campaign",
          "creative_links",
          "adset_name",
          "optimization_goal",
          "billing_event",
          "facebook_adset_id",
          "facebook_adset_status",
          "campaign_name",
          "campaign_customer_id",
          "account_id",
          "account_name",
          "campaign_id",
          "buying_type",
          "creative_thumbs",
          "body",
          "timegroup",
          "formatted_adset_end_date",
          "formatted_adset_start_date",
          "reporting_status_display"
        ],
        "type": "object"
      },
      "type": "array"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "total_data",
    "error",
    "warnings",
    "query_id",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": {
    "aaData": [
      {
        "AdMobilePreviewURL": "<a target='_blank' href='https://mymetrics.yp.ca/app/dash/index/get_facebook_ad_preview/fields/U5cBtcOT1BETH4lv82JUkPaPe8vozC32%7C%3D%7C%3D%7Cbu4i3yX1l9ggCJ19Jr9SOt5Ew8lqiZ50lVxA0w4swDMLVkr003phVpCAnOfY0UIGVGxFTywP22xubHtleK8eA%3D%3D'>Click Here</a>",
        "AdPreviewURL": "<a target='_blank' href='https://mymetrics.yp.ca/app/dash/index/get_facebook_ad_preview/fields/6sAUryt39ijEQSLaWJWCE8Rr8pYBObYMeFFhCGCUv2lQ6uW%2BIAAQm86aRGg9yS0sDx1xv7S52R9JcfCT5riGTQ%2BlZwnETbEpKotxCuB%7C%3D%7C%3D%7CjJUsyA%3D%3D'>Click Here</a>",
        "AvgfrequencyCount": "1.10",
        "AvgreachCount": "909.25",
        "CpcLinkCount": "0.28",
        "CpmCount": "6.474709875",
        "CtrLinkCount": "2.28",
        "ImpressionCount": "4567",
        "Inline_link_clickCount": "104",
        "Offsite_leadCount": "0",
        "On_facebook_leadsCount": "0",
        "Video_viewsCount": "0",
        "adgroup_id": "616742",
        "adset_end_date": 1793491200,
        "adset_start_date": 1777593600,
        "calculation_151": 0,
        "connection_id_for_preview": "284",
        "creative_links": "<a href=\"https://www.roofdoctor.ca/\" target=\"_blank\">https://www.roofdoctor.ca/</a>",
        "facebook_adgroup_id": "120242762599710585",
        "facebook_positions": "feed, right_hand_column, marketplace, story, search, biz_disco_feed, facebook_reels, profile_feed, notification",
        "formatted_adset_end_date": "Nov 01, 2026",
        "formatted_adset_start_date": "May 01, 2026",
        "name": "Ad 2  Carousel",
        "objective_campaign": "Outcome Traffic",
        "preview_url": null,
        "reporting_status_display": null,
        "targeting_instagram_positions": "stream, story, reels, explore_home, profile_feed, ig_search",
        "targeting_publisher_platforms": "facebook, instagram, messenger",
        "timegroup": "hourly"
      },
      {
        "AdMobilePreviewURL": "<a target='_blank' href='https://mymetrics.yp.ca/app/dash/index/get_facebook_ad_preview/fields/pcbHKefdaRR6XXeZhBcLnHWH3O4ECrIzvCzjSXHXXM57YYg3enzUdkiMLR9s9vgME5U0sO8g8iKW%7C%3D%7C%3D%7Cq%7C%3D%7C%3D%7CWc6Y8%7C%3D%7C%3D%7CkOfneqCHP%7C%3D%7C%3D%7C5rZjcjsNkZQzslvW1HBcocQ%3D%3D'>Click Here</a>",
        "AdPreviewURL": "<a target='_blank' href='https://mymetrics.yp.ca/app/dash/index/get_facebook_ad_preview/fields/gWo5xy2E2C0NXDTWsMg8flS5EarBBBzhf4Dh4SxgQ8a8B4ehvxe%7C%3D%7C%3D%7CuepySyoCjVbVlR8MWdQn4PHMKFenmam3m%2BMb0uYZEXifTaqlgy4g1cuB8A%3D%3D'>Click Here</a>",
        "AvgfrequencyCount": "1.17",
        "AvgreachCount": "1017.33",
        "CpcLinkCount": "0.3",
        "CpmCount": "5.240420063",
        "CtrLinkCount": "1.76",
        "ImpressionCount": "4097",
        "Inline_link_clickCount": "72",
        "Offsite_leadCount": "0",
        "On_facebook_leadsCount": "0",
        "Video_viewsCount": "4",
        "adgroup_id": "626052",
        "adset_end_date": 1809129600,
        "adset_start_date": 1793491200,
        "calculation_151": 0,
        "connection_id_for_preview": "284",
        "creative_links": "<a href=\"https://www.roofdoctor.ca/\" target=\"_blank\">https://www.roofdoctor.ca/</a>",
        "facebook_adgroup_id": "120250190593910585",
        "facebook_positions": "feed, right_hand_column, marketplace, story, search, biz_disco_feed, facebook_reels, profile_feed, notification",
        "formatted_adset_end_date": "May 01, 2027",
        "formatted_adset_start_date": "Nov 01, 2026",
        "name": "Roof Doctor - Traffic - General - Nov 1st/26 to Apr 30th/27__Ad2 Carousel",
        "objective_campaign": "Outcome Traffic",
        "preview_url": null,
        "reporting_status_display": null,
        "targeting_instagram_positions": "stream, story, reels, explore_home, profile_feed, ig_search",
        "targeting_publisher_platforms": "facebook, instagram",
        "timegroup": "hourly"
      }
    ],
    "iTotalDisplayRecords": 3,
    "iTotalRecords": 3,
    "sEcho": "prod"
  },
  "error": false,
  "query_id": "4aba52c1-2930-44ae-91c7-f759fff5ed38",
  "status": 200,
  "total_data": [
    {
      "AdMobilePreviewURL": "AdMobilePreviewURL",
      "AdPreviewURL": "AdPreviewURL",
      "AvgfrequencyCount": "1.11",
      "AvgreachCount": "836.25",
      "CpcLinkCount": "0.29",
      "CpmCount": "5.891517715",
      "CtrLinkCount": "2.03",
      "ImpressionCount": "8665",
      "Inline_link_clickCount": "176",
      "Offsite_leadCount": "0",
      "On_facebook_leadsCount": "0",
      "Video_viewsCount": "5",
      "account_id": "464542177961783",
      "account_name": "Roof Doctor",
      "adgroup_id": "616742",
      "adset_end_date": 1793491200,
      "adset_name": "Roof Doctor - Traffic - General (duplicate2) - May 1st/26 to Oct 31st/26",
      "adset_start_date": 1777593600,
      "billing_event": "IMPRESSIONS",
      "body": "",
      "buying_type": "AUCTION",
      "calculation_151": 0,
      "campaign_customer_id": "39068",
      "campaign_id": "120242762599750585",
      "campaign_name": "Roof Doctor - Traffic - General (duplicate2) - May 1st/26 to Oct 31st/26",
      "connection_id_for_preview": "284",
      "creative_links": "<a href=\"https://www.roofdoctor.ca/\" target=\"_blank\">https://www.roofdoctor.ca/</a>",
      "creative_thumbs": "https://external-iad3-2.xx.fbcdn.net/emg1/v/t13/15730515315740037052?url=https%3A%2F%2Fwww.facebook.com%2Fads%2Fimage%2F%3Fd%3DAQLQJR_udArmV1dX8KkcmbkLVNcUxlqoGrw9FocuFthY5ezOmkImHDEePTvuYSoqNUxte-4n0yDA550WNz3qRsXgyHfy-8zdyxsJXLTzfPPmRqY11-e3RljVSItNzyq-t8CoJIxgmDyoRPdxRE66eYe_&fb_obo=1&utld=facebook.com&_nc_sid={redacted}&_nc_ht=external-iad3-2.xx.fbcdn.net&stp=c0.5000x0.5000f_dst-emg0_p64x64_q75_tt6&ccb=18-1&_nc_gid=rL8e--fzQ4wUYctbxTb3fA&edm=AEuWsiQEAAAA&_nc_zt=3&_nc_tpa=Q5bMBQJeXmyr7lJCOwccLjkk",
      "facebook_adgroup_id": "120242762599710585",
      "facebook_adset_id": "120242762599770585",
      "facebook_adset_status": "ACTIVE",
      "facebook_positions": "feed, right_hand_column, marketplace, story, search, biz_disco_feed, facebook_reels, profile_feed, notification",
      "formatted_adset_end_date": "Nov 01, 2026",
      "formatted_adset_start_date": "May 01, 2026",
      "name": "Ad 2  Carousel",
      "objective_campaign": "OUTCOME_TRAFFIC",
      "optimization_goal": "LINK_CLICKS",
      "preview_url": null,
      "reporting_status_display": null,
      "targeting_instagram_positions": "stream, story, reels, explore_home, profile_feed, ig_search",
      "targeting_publisher_platforms": "facebook, instagram",
      "timegroup": "hourly"
    }
  ],
  "warnings": []
}
```

**Bindings** (12)

- `query widget_request` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[135]` (seen 3x)
- `query widget_type` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.1592.widgets.29433.type` (seen 3x)
- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 3x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 3x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 3x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 3x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 3x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 3x)
- `cookie adminhtml` comes from `GET /server/api/services/{serviceId}/data/cgn` `set-cookie adminhtml` (seen 3x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 3x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 3x)
- `set-cookie adminhtml` feeds `GET /server/api/services/{serviceId}/data/device` `cookie adminhtml`

**Observed in** (3)

- YP Metrics tour, step `tab-facebook-ads-management`, run `20261104T214824Z-f674`, 2026-11-04T21:55:20.290Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1190:0`
- YP Metrics tour, step `range-30-days`, run `20261104T214824Z-f674`, 2026-11-04T21:55:37.690Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1208:0`
- YP Metrics tour, step `range-last-month`, run `20261104T214824Z-f674`, 2026-11-04T21:55:59.132Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1226:0`

### `GET /server/api/services/{serviceId}/data/cgn`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `serviceId` | path | binding | `1000028` | yes |
| `query_id` | query | computed | `2943cfdf-b65a-4494-8bcc-78b61fad15d3` | yes |
| `daterange` | query | literal | `2026-11-03\|2026-11-03` | yes |
| `fields` | query | binding | `Column11Count` | yes |
| `groupby` | query | binding | `column13` | no |
| `widget_request` | query | binding | `8379` | yes |
| `widget_type` | query | binding | `piechart` | yes |
| `widget_page_id` | query | literal | `92` | yes |
| `aggregate` | query | literal | `true` | no |
| `sort` | query | binding | `log_date` | no |
| `timegrouping` | query | binding | `dynamic` | no |
| `datatable` | query | literal | `true` | no |
| `page` | query | literal | `0,10` | no |
| `filter_set_id` | query | binding | `2500` | no |
| `show_empty_dates` | query | literal | `true` | no |
| `total` | query | literal | `true` | no |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "anyOf": [
        {
          "items": {
            "properties": {
              "AvgfrequencyCount": {
                "type": "string"
              },
              "AvgreachCount": {
                "type": "string"
              },
              "ClickCount": {
                "type": "string"
              },
              "Column11Count": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "Column18Count": {
                "type": "null"
              },
              "Column19Count": {
                "type": "null"
              },
              "Column3Count": {
                "type": "integer"
              },
              "Column5Count": {
                "type": "integer"
              },
              "DisplayBudgetLostImpShareCount": {
                "type": "null"
              },
              "DisplayRankLostImpShareCount": {
                "type": "null"
              },
              "ImpressionCount": {
                "type": "string"
              },
              "Inline_link_clickCount": {
                "type": "string"
              },
              "PossibleDisplayImpressions": {
                "type": "null"
              },
              "PossibleSearchImpressions": {
                "type": "string"
              },
              "SearchBudgetLostImpShareCount": {
                "type": "string"
              },
              "SearchRankLostImpShareCount": {
                "type": "string"
              },
              "Video_viewsCount": {
                "type": "string"
              },
              "advertising_channel_type": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "calculation_142": {
                "type": "integer"
              },
              "calculation_202": {
                "type": "string"
              },
              "calculation_204": {
                "type": "string"
              },
              "calculation_209": {
                "type": "null"
              },
              "calculation_210": {
                "type": "null"
              },
              "calculation_214": {
                "type": "null"
              },
              "calculation_215": {
                "type": "string"
              },
              "calculation_233": {
                "type": "string"
              },
              "calculation_271": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "calculation_84": {
                "type": "null"
              },
              "calculation_85": {
                "type": "null"
              },
              "column13": {
                "type": "string"
              },
              "column15": {
                "type": "string"
              },
              "column2": {
                "type": "string"
              },
              "column4": {
                "type": "string"
              },
              "column5": {
                "type": "string"
              },
              "column7": {
                "type": "string"
              },
              "customer_id": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "formatted_log_date": {
                "type": "string"
              },
              "log_date": {
                "anyOf": [
                  {
                    "type": "integer"
                  },
                  {
                    "type": "string"
                  }
                ]
              },
              "network": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "reporting_status_display": {
                "type": "null"
              },
              "row_grouping_count": {
                "type": "integer"
              },
              "timegroup": {
                "type": "string"
              }
            },
            "type": "object"
          },
          "type": "array"
        },
        {
          "properties": {
            "aaData": {
              "items": {
                "properties": {
                  "AvgfrequencyCount": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "AvgreachCount": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "Column3Count": {
                    "type": "integer"
                  },
                  "Column4Count": {
                    "anyOf": [
                      {
                        "type": "string"
                      },
                      {
                        "type": "integer"
                      }
                    ]
                  },
                  "CpcLinkCount": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "CpmCount": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "CtrLinkCount": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "ImpressionCount": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "Inline_link_clickCount": {
                    "type": "string"
                  },
                  "Offsite_leadCount": {
                    "type": "string"
                  },
                  "On_facebook_leadsCount": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "Video_viewsCount": {
                    "type": "string"
                  },
                  "calculation_143": {
                    "type": "integer"
                  },
                  "calculation_144": {
                    "type": "integer"
                  },
                  "calculation_150": {
                    "type": "integer"
                  },
                  "campaign_id": {
                    "type": "string"
                  },
                  "column2": {
                    "type": "string"
                  },
                  "column3": {
                    "type": "string"
                  },
                  "column7": {
                    "type": "string"
                  },
                  "column9": {
                    "type": "string"
                  },
                  "customer_id": {
                    "type": "string"
                  },
                  "name": {
                    "type": "string"
                  },
                  "objective": {
                    "type": "string"
                  },
                  "reporting_status_display": {
                    "type": "null"
                  }
                },
                "required": [
                  "customer_id",
                  "reporting_status_display"
                ],
                "type": "object"
              },
              "type": "array"
            },
            "iTotalDisplayRecords": {
              "type": "integer"
            },
            "iTotalRecords": {
              "type": "integer"
            },
            "sEcho": {
              "type": "string"
            }
          },
          "required": [
            "sEcho",
            "iTotalRecords",
            "iTotalDisplayRecords",
            "aaData"
          ],
          "type": "object"
        }
      ]
    },
    "error": {
      "type": "boolean"
    },
    "query_id": {
      "format": "uuid",
      "type": "string"
    },
    "status": {
      "type": "integer"
    },
    "total_data": {
      "items": {
        "properties": {
          "AvgfrequencyCount": {
            "type": "string"
          },
          "AvgreachCount": {
            "type": "string"
          },
          "CpcLinkCount": {
            "type": "string"
          },
          "CpmCount": {
            "type": "string"
          },
          "CtrLinkCount": {
            "type": "string"
          },
          "ImpressionCount": {
            "type": "string"
          },
          "Inline_link_clickCount": {
            "type": "string"
          },
          "Offsite_leadCount": {
            "type": "string"
          },
          "On_facebook_leadsCount": {
            "type": "string"
          },
          "Video_viewsCount": {
            "type": "string"
          },
          "calculation_150": {
            "type": "integer"
          },
          "campaign_id": {
            "type": "string"
          },
          "customer_id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "objective": {
            "type": "string"
          },
          "reporting_status_display": {
            "type": "null"
          }
        },
        "required": [
          "objective",
          "campaign_id",
          "name",
          "AvgreachCount",
          "AvgfrequencyCount",
          "ImpressionCount",
          "CpmCount",
          "Inline_link_clickCount",
          "CpcLinkCount",
          "CtrLinkCount",
          "calculation_150",
          "Video_viewsCount",
          "customer_id",
          "On_facebook_leadsCount",
          "Offsite_leadCount",
          "reporting_status_display"
        ],
        "type": "object"
      },
      "type": "array"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "query_id",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": [
    {
      "Column11Count": "550.000000000",
      "column13": "Facebook",
      "customer_id": "39068",
      "reporting_status_display": null
    },
    {
      "Column11Count": "56.210000000",
      "column13": "NetSync",
      "customer_id": "39068",
      "reporting_status_display": null
    }
  ],
  "error": false,
  "query_id": "2943cfdf-b65a-4494-8bcc-78b61fad15d3",
  "status": 200,
  "warnings": []
}
```

**Bindings** (122)

- `path serviceId` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.data_sources[7].data_source_id` (seen 3x)
- `query fields` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.125.widgets.8379.metadata.data_columns.selected[0].field` (seen 5x)
- `query groupby` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.125.widgets.8379.metadata.data_columns.grouped[0].field` (seen 3x)
- `query widget_request` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[27]` (seen 3x)
- `query widget_type` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.125.widgets.8379.type` (seen 7x)
- `cookie ajs_user_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.userEmail` (seen 1x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 45x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 45x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 45x)
- `cookie ajs_group_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.instanceURL` (seen 1x)
- `cookie SimpleSAMLAuthToken` comes from `POST /simplesaml/module.php/saml/sp/saml2-acs.php/mymetrics_yp_ca_activedirectory_ypcanada` `set-cookie SimpleSAMLAuthToken` (seen 1x)
- `cookie adminhtml` comes from `GET /server/api/dash/widgets/{widgetId}/data` `set-cookie adminhtml` (seen 6x)
- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 44x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 44x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 44x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 44x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 44x)
- `path serviceId` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.data_sources[6].data_source_id` (seen 1x)
- `query fields` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.347.widgets.9996.metadata.data_columns.selected[0].field` (seen 1x)
- `query groupby` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.347.widgets.9996.metadata.data_columns.grouped[0].field` (seen 1x)
- and 102 more

**Observed in** (45)

- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:35.305Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.795:0`
- YP Metrics tour, step `open-fav-dashboards-92`, run `20261104T214824Z-f674`, 2026-11-04T21:49:30.154Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.858:0`
- YP Metrics tour, step `open-fav-dashboards-139`, run `20261104T214824Z-f674`, 2026-11-04T21:49:51.721Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.889:0`
- YP Metrics tour, step `open-dashboard-english`, run `20261104T214824Z-f674`, 2026-11-04T21:53:05.843Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1009:0`
- YP Metrics tour, step `tab-yp-network`, run `20261104T214824Z-f674`, 2026-11-04T21:53:48.795Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1038:0`
- YP Metrics tour, step `tab-yp-network`, run `20261104T214824Z-f674`, 2026-11-04T21:53:48.829Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1039:0`
- YP Metrics tour, step `tab-yp-network`, run `20261104T214824Z-f674`, 2026-11-04T21:53:48.833Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1040:0`
- YP Metrics tour, step `tab-yp-network`, run `20261104T214824Z-f674`, 2026-11-04T21:53:51.823Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1057:0`
- YP Metrics tour, step `tab-yp-network`, run `20261104T214824Z-f674`, 2026-11-04T21:53:51.911Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1058:0`
- YP Metrics tour, step `tab-yp-network`, run `20261104T214824Z-f674`, 2026-11-04T21:53:51.957Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1059:0`
- YP Metrics tour, step `tab-yp-network`, run `20261104T214824Z-f674`, 2026-11-04T21:53:51.977Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1060:0`
- YP Metrics tour, step `tab-yp-network`, run `20261104T214824Z-f674`, 2026-11-04T21:53:52.030Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1061:0`
- and 33 more

### `GET /server/api/services/{serviceId}/data/cgnad`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `serviceId` | path | literal | `34` | yes |
| `query_id` | query | computed | `3e71594e-efbd-408f-8bad-f11020a0af25` | yes |
| `daterange` | query | literal | `2026-10-28\|2026-11-03` | yes |
| `filter_set_id` | query | binding | `5017` | yes |
| `fields` | query | literal | `preview,ImpressionCount,ClickCount,AverageCPC` | yes |
| `aggregate` | query | literal | `false` | yes |
| `datatable` | query | literal | `true` | yes |
| `page` | query | literal | `0,10` | yes |
| `sort` | query | literal | `-ClickCount` | yes |
| `groupby` | query | binding | `preview` | yes |
| `widget_request` | query | binding | `40739` | yes |
| `widget_type` | query | binding | `datagrid` | yes |
| `widget_page_id` | query | literal | `92` | yes |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "properties": {
        "aaData": {
          "items": {
            "properties": {
              "AverageCPC": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "ClickCount": {
                "type": "string"
              },
              "ImpressionCount": {
                "type": "string"
              },
              "ad_id": {
                "type": "string"
              },
              "ad_type": {
                "type": "string"
              },
              "advertising_channel_type": {
                "type": "string"
              },
              "business_name": {
                "type": "string"
              },
              "calculation_283": {
                "type": "string"
              },
              "description": {
                "type": "string"
              },
              "display_url": {
                "type": "string"
              },
              "expanded_text_ad_description2": {
                "type": "string"
              },
              "expanded_text_ad_headline_part3": {
                "type": "string"
              },
              "final_urls": {
                "type": "string"
              },
              "headline_part1": {
                "type": "string"
              },
              "headline_part2": {
                "type": "string"
              },
              "line1": {
                "type": "string"
              },
              "line2": {
                "type": "string"
              },
              "logo_image_url": {
                "type": "string"
              },
              "long_headline": {
                "type": "string"
              },
              "marketing_image_url": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "network": {
                "type": "string"
              },
              "path1": {
                "type": "string"
              },
              "path2": {
                "type": "string"
              },
              "preview": {
                "type": "string"
              },
              "reporting_status_display": {
                "type": "null"
              },
              "responsive_display_ad_first_youtube_video_id": {
                "type": "string"
              },
              "responsive_display_ad_first_youtube_video_title": {
                "type": "string"
              },
              "short_headline": {
                "type": "string"
              }
            },
            "required": [
              "preview",
              "ImpressionCount",
              "ClickCount",
              "AverageCPC",
              "calculation_283",
              "ad_type",
              "final_urls",
              "headline_part1",
              "headline_part2",
              "path1",
              "path2",
              "description",
              "expanded_text_ad_description2",
              "expanded_text_ad_headline_part3",
              "marketing_image_url",
              "logo_image_url",
              "short_headline",
              "long_headline",
              "name",
              "display_url",
              "line1",
              "line2",
              "business_name",
              "responsive_display_ad_first_youtube_video_id",
              "responsive_display_ad_first_youtube_video_title",
              "ad_id",
              "advertising_channel_type",
              "network",
              "reporting_status_display"
            ],
            "type": "object"
          },
          "type": "array"
        },
        "iTotalDisplayRecords": {
          "type": "integer"
        },
        "iTotalRecords": {
          "type": "integer"
        },
        "sEcho": {
          "type": "string"
        }
      },
      "required": [
        "sEcho",
        "iTotalRecords",
        "iTotalDisplayRecords",
        "aaData"
      ],
      "type": "object"
    },
    "error": {
      "type": "boolean"
    },
    "query_id": {
      "format": "uuid",
      "type": "string"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "query_id",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": {
    "aaData": [
      {
        "AverageCPC": "9.096666667",
        "ClickCount": "6",
        "ImpressionCount": "170",
        "ad_id": "10473482",
        "ad_type": "RESPONSIVE_SEARCH_AD",
        "advertising_channel_type": "SEARCH",
        "business_name": "",
        "calculation_283": "Google Search",
        "description": "At Roof Doctor, We Offer Quality Residential Roofing Services. Request A Free Estimate!; Expert Roofing For Homes, Condos, And Apartments In Kelowna And The Greater Okanagan.; Reliable Residential Roofing Tailored To Your Property, Size, And Design Specifications.; Licensed And Insured Crews For New Roofs, Re-Roofing, And Maintenance Across The Okanagan.; ",
        "display_url": "",
        "expanded_text_ad_description2": "",
        "expanded_text_ad_headline_part3": "",
        "final_urls": "<a href=\"https://www.roofdoctor.ca/services?_vsrefdom=roof-doctor\" target=\"_blank\" rel=\"noopener\">https://www.roofdoctor.ca/services?_vsrefdom=roof-doctor</a>",
        "headline_part1": "Residential Roofing Near You; Asphalt Shingle Roofing; Metal Roofing In {LOCATION(City):Kelowna}; Tile Roofing Services; Roofing Replacement Services; Locally-Owned; Multiple Award-Winning Company; Skilled Experts; Safeguarding Your Home; 24/7 Emergency Assistance; Comprehensive Assessment; Fill Out Our Form!; Wide Range Of Services; We Served Homes Of All Sizes; Request A Free Estimate; ",
        "headline_part2": "",
        "line1": "",
        "line2": "",
        "logo_image_url": "Preview not available",
        "long_headline": "",
        "marketing_image_url": "Preview not available",
        "name": "Residential Roofing Near You; Asphalt Shingle Roofing; Metal Roofing In {LOCATION(City):Kelowna}; Tile Roofing Services; Roofing Replacement Services; Locally-Owned; Multiple Award-Winning Company; Skilled Experts; Safeguarding Your Home; 24/7 Emergency Assistance; Comprehensive Assessment; Fill Out Our Form!; Wide Range Of Services; We Served Homes Of All Sizes; Request A Free Estimate; ",
        "network": "SEARCH",
        "path1": "Residential",
        "path2": "Roofing",
        "preview": "<div><div style='color:#1a0dab;'>Residential Roofing Near You | Asphalt Shingle Roofing | Metal Roofing In {LOCATION(City):Kelowna} | Tile Roofing Services | Roofing Replacement Services | Locally-Owned | Multiple Award-Winning Company | Skilled Experts | Safeguarding Your Home | 24/7 Emergency Assistance | Comprehensive Assessment | Fill Out Our Form! | Wide Range Of Services | We Served Homes Of All Sizes | Request A Free Estimate</div><div style='color:#006621;'><a href=\"https://www.roofdoctor.ca/services?_vsrefdom=roof-doctor\" target=\"_blank\" rel=\"noopener\">https://www.roofdoctor.ca/Residential/Roofing</a></div><div style='color:#222222;'>At Roof Doctor, We Offer Quality Residential Roofing Services. Request A Free Estimate!, Expert Roofing For Homes, Condos, And Apartments In Kelowna And The Greater Okanagan., Reliable Residential Roofing Tailored To Your Property, Size, And Design Specifications., Licensed And Insured Crews For New Roofs, Re-Roofing, And Maintenance Across The Okanagan.</div></div>",
        "reporting_status_display": null,
        "responsive_display_ad_first_youtube_video_id": "Preview not available",
        "responsive_display_ad_first_youtube_video_title": "",
        "short_headline": ""
      },
      {
        "AverageCPC": "5.398333333",
        "ClickCount": "6",
        "ImpressionCount": "55",
        "ad_id": "10473481",
        "ad_type": "RESPONSIVE_SEARCH_AD",
        "advertising_channel_type": "SEARCH",
        "business_name": "",
        "calculation_283": "Google Search",
        "description": "At Roof Doctor, We Offer Residential And Commercial Roof Repair. Request A Free Estimate!; We've Been Providing Quality Roof Repair Services Since 2011 In Kelowna & Surroundings.; Built To Last By Expert Craftsmanship Offering A 10-Year Warranty & Post-Project Support.; Our Team Has The Experience In The Latest Products & Technologies In Roofing Services.; ",
        "display_url": "",
        "expanded_text_ad_description2": "",
        "expanded_text_ad_headline_part3": "",
        "final_urls": "<a href=\"https://www.roofdoctor.ca/services/roofing-repairs?_vsrefdom=roof-doctor\" target=\"_blank\" rel=\"noopener\">https://www.roofdoctor.ca/services/roofing-repairs?_vsrefdom=roof-doctor</a>",
        "headline_part1": "Roof Repairs In {LOCATION(City):Kelowna}; Roof Inspection In {LOCATION(City):Peachland}; Roof Leak Repair Near You; Roof Maintenance Service; Residential Roof Repair; Commercial Roof Repair; Roof Wind Damage Repair; Multiple Award-Winning Company; Skilled Experts; Safeguarding Your Home; 24/7 Emergency Assistance; Comprehensive Assessment; Locally-Owned; Safety-Oriented; Industry Leaders; ",
        "headline_part2": "",
        "line1": "",
        "line2": "",
        "logo_image_url": "Preview not available",
        "long_headline": "",
        "marketing_image_url": "Preview not available",
        "name": "Roof Repairs In {LOCATION(City):Kelowna}; Roof Inspection In {LOCATION(City):Peachland}; Roof Leak Repair Near You; Roof Maintenance Service; Residential Roof Repair; Commercial Roof Repair; Roof Wind Damage Repair; Multiple Award-Winning Company; Skilled Experts; Safeguarding Your Home; 24/7 Emergency Assistance; Comprehensive Assessment; Locally-Owned; Safety-Oriented; Industry Leaders; ",
        "network": "SEARCH",
        "path1": "Roof_Repair",
        "path2": "Services",
        "preview": "<div><div style='color:#1a0dab;'>Roof Repairs In {LOCATION(City):Kelowna} | Roof Inspection In {LOCATION(City):Peachland} | Roof Leak Repair Near You | Roof Maintenance Service | Residential Roof Repair | Commercial Roof Repair | Roof Wind Damage Repair | Multiple Award-Winning Company | Skilled Experts | Safeguarding Your Home | 24/7 Emergency Assistance | Comprehensive Assessment | Locally-Owned | Safety-Oriented | Industry Leaders</div><div style='color:#006621;'><a href=\"https://www.roofdoctor.ca/services/roofing-repairs?_vsrefdom=roof-doctor\" target=\"_blank\" rel=\"noopener\">https://www.roofdoctor.ca/Roof_Repair/Services</a></div><div style='color:#222222;'>At Roof Doctor, We Offer Residential And Commercial Roof Repair. Request A Free Estimate!, We've Been Providing Quality Roof Repair Services Since 2011 In Kelowna & Surroundings., Built To Last By Expert Craftsmanship Offering A 10-Year Warranty & Post-Project Support., Our Team Has The Experience In The Latest Products & Technologies In Roofing Services.</div></div>",
        "reporting_status_display": null,
        "responsive_display_ad_first_youtube_video_id": "Preview not available",
        "responsive_display_ad_first_youtube_video_title": "",
        "short_headline": ""
      }
    ],
    "iTotalDisplayRecords": 6,
    "iTotalRecords": 6,
    "sEcho": "prod"
  },
  "error": false,
  "query_id": "3e71594e-efbd-408f-8bad-f11020a0af25",
  "status": 200,
  "warnings": []
}
```

**Bindings** (19)

- `query filter_set_id` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.2267.widgets.40739.metadata.filter_set_id` (seen 1x)
- `query groupby` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.2267.widgets.40739.metadata.data_columns.selected[0].field` (seen 1x)
- `query widget_request` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[147]` (seen 1x)
- `query widget_type` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.2267.widgets.40735.type` (seen 3x)
- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 3x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 3x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 3x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 3x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 3x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 3x)
- `cookie adminhtml` comes from `GET /server/api/services/{serviceId}/data/keyword` `set-cookie adminhtml` (seen 1x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 3x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 3x)
- `query filter_set_id` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.2267.widgets.40749.metadata.filter_set_id` (seen 1x)
- `query widget_request` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[156]` (seen 1x)
- `cookie adminhtml` comes from `GET /server/api/categories/{categoryId}/data/{dataId}` `set-cookie adminhtml` (seen 2x)
- `query filter_set_id` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.2267.widgets.40763.metadata.filter_set_id` (seen 1x)
- `query widget_request` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[170]` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/categories/{categoryId}/data/{dataId}` `cookie adminhtml`

**Observed in** (3)

- YP Metrics tour, step `tab-sem`, run `20261104T214824Z-f674`, 2026-11-04T21:55:00.667Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1161:0`
- YP Metrics tour, step `tab-sem`, run `20261104T214824Z-f674`, 2026-11-04T21:55:00.906Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1165:0`
- YP Metrics tour, step `tab-sem`, run `20261104T214824Z-f674`, 2026-11-04T21:55:01.012Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1167:0`

### `GET /server/api/services/{serviceId}/data/city`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `serviceId` | path | literal | `34` | yes |
| `query_id` | query | computed | `9a041777-754f-41c7-8551-a096fec67e1b` | unknown |
| `daterange` | query | literal | `2026-10-28\|2026-11-03` | unknown |
| `filter_set_id` | query | binding | `5339` | unknown |
| `fields` | query | literal | `city,ClickCount` | unknown |
| `aggregate` | query | literal | `false` | unknown |
| `datatable` | query | literal | `true` | unknown |
| `page` | query | literal | `0,10` | unknown |
| `sort` | query | literal | `-ClickCount` | unknown |
| `groupby` | query | literal | `city` | unknown |
| `widget_request` | query | binding | `46784` | unknown |
| `widget_type` | query | binding | `datagrid` | unknown |
| `widget_page_id` | query | literal | `92` | unknown |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "properties": {
        "aaData": {
          "items": {
            "properties": {
              "ClickCount": {
                "type": "string"
              },
              "advertising_channel_type": {
                "type": "string"
              },
              "calculation_287": {
                "type": "string"
              },
              "city": {
                "type": "string"
              },
              "country": {
                "type": "string"
              },
              "network": {
                "type": "string"
              },
              "region": {
                "type": "string"
              },
              "reporting_status_display": {
                "type": "null"
              }
            },
            "required": [
              "city",
              "ClickCount",
              "calculation_287",
              "region",
              "country",
              "network",
              "advertising_channel_type",
              "reporting_status_display"
            ],
            "type": "object"
          },
          "type": "array"
        },
        "iTotalDisplayRecords": {
          "type": "integer"
        },
        "iTotalRecords": {
          "type": "integer"
        },
        "sEcho": {
          "type": "string"
        }
      },
      "required": [
        "sEcho",
        "iTotalRecords",
        "iTotalDisplayRecords",
        "aaData"
      ],
      "type": "object"
    },
    "error": {
      "type": "boolean"
    },
    "query_id": {
      "format": "uuid",
      "type": "string"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "query_id",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": {
    "aaData": [
      {
        "ClickCount": "10",
        "advertising_channel_type": "SEARCH",
        "calculation_287": "Google Search",
        "city": "Kelowna",
        "country": "Canada",
        "network": "SEARCH",
        "region": "British Columbia",
        "reporting_status_display": null
      },
      {
        "ClickCount": "2",
        "advertising_channel_type": "SEARCH",
        "calculation_287": "Google Search",
        "city": "Penticton",
        "country": "Canada",
        "network": "SEARCH",
        "region": "British Columbia",
        "reporting_status_display": null
      }
    ],
    "iTotalDisplayRecords": 13,
    "iTotalRecords": 10,
    "sEcho": "prod"
  },
  "error": false,
  "query_id": "9a041777-754f-41c7-8551-a096fec67e1b",
  "status": 200,
  "warnings": []
}
```

**Bindings** (13)

- `query filter_set_id` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.2267.widgets.46784.metadata.filter_set_id` (seen 1x)
- `query widget_request` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[174]` (seen 1x)
- `query widget_type` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.2267.widgets.40735.type` (seen 1x)
- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 1x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 1x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 1x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 1x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 1x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 1x)
- `cookie adminhtml` comes from `GET /server/api/services/{serviceId}/data/adgroup` `set-cookie adminhtml` (seen 1x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 1x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/services/{serviceId}/data/keyword` `cookie adminhtml`

**Observed in** (1)

- YP Metrics tour, step `tab-sem`, run `20261104T214824Z-f674`, 2026-11-04T21:55:00.042Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1159:0`

### `GET /server/api/services/{serviceId}/data/conversion`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `serviceId` | path | literal | `34` | yes |
| `query_id` | query | computed | `40483251-4b1a-427f-a52f-d2c725385874` | unknown |
| `daterange` | query | literal | `2026-10-28\|2026-11-03` | unknown |
| `filter_set_id` | query | binding | `7074` | unknown |
| `fields` | query | binding | `Conversion_manyperclickCount` | unknown |
| `groupby` | query | binding | `conversion_category_name` | unknown |
| `widget_request` | query | binding | `78385` | unknown |
| `widget_type` | query | binding | `piechart` | unknown |
| `widget_page_id` | query | literal | `92` | unknown |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "type": "array"
    },
    "error": {
      "type": "boolean"
    },
    "query_id": {
      "format": "uuid",
      "type": "string"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "query_id",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": [],
  "error": false,
  "query_id": "40483251-4b1a-427f-a52f-d2c725385874",
  "status": 200,
  "warnings": []
}
```

**Bindings** (15)

- `query filter_set_id` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.2267.widgets.78385.metadata.filter_set_id` (seen 1x)
- `query fields` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.2267.widgets.78385.metadata.data_columns.selected[0].field` (seen 1x)
- `query groupby` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.2267.widgets.78385.metadata.data_columns.grouped[0].field` (seen 1x)
- `query widget_request` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[180]` (seen 1x)
- `query widget_type` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.125.widgets.8379.type` (seen 1x)
- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 1x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 1x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 1x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 1x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 1x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 1x)
- `cookie adminhtml` comes from `GET /server/api/categories/{categoryId}/data/{dataId}` `set-cookie adminhtml` (seen 1x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 1x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/services/{serviceId}/data/cgn` `cookie adminhtml`

**Observed in** (1)

- YP Metrics tour, step `tab-sem`, run `20261104T214824Z-f674`, 2026-11-04T21:54:57.403Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1146:0`

### `GET /server/api/services/{serviceId}/data/device`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `serviceId` | path | literal | `34` | yes |
| `query_id` | query | computed | `0f7bbb64-9461-4161-ab8b-bab306f02ce7` | yes |
| `daterange` | query | literal | `2026-10-28\|2026-11-03` | yes |
| `filter_set_id` | query | binding | `5012` | no |
| `fields` | query | literal | `ClickCount,name` | yes |
| `groupby` | query | binding | `device_id` | yes |
| `widget_request` | query | binding | `40734` | yes |
| `widget_type` | query | binding | `piechart` | yes |
| `widget_page_id` | query | literal | `92` | yes |
| `aggregate` | query | literal | `false` | no |
| `datatable` | query | literal | `true` | no |
| `limit` | query | literal | `10` | no |
| `sort` | query | literal | `-ImpressionCount` | no |
| `total` | query | literal | `true` | no |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "anyOf": [
        {
          "items": {
            "properties": {
              "ClickCount": {
                "type": "string"
              },
              "advertising_channel_type": {
                "type": "string"
              },
              "calculation_286": {
                "type": "string"
              },
              "device_id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "network": {
                "type": "string"
              },
              "reporting_status_display": {
                "type": "null"
              }
            },
            "required": [
              "device_id",
              "name",
              "ClickCount",
              "calculation_286",
              "network",
              "advertising_channel_type",
              "reporting_status_display"
            ],
            "type": "object"
          },
          "type": "array"
        },
        {
          "properties": {
            "aaData": {
              "items": {
                "properties": {
                  "AvgfrequencyCount": {
                    "type": "string"
                  },
                  "AvgreachCount": {
                    "type": "string"
                  },
                  "CpcLinkCount": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "CpmCount": {
                    "type": "string"
                  },
                  "CtrLinkCount": {
                    "type": "string"
                  },
                  "ImpressionCount": {
                    "type": "string"
                  },
                  "Inline_link_clickCount": {
                    "type": "string"
                  },
                  "Offsite_leadCount": {
                    "type": "string"
                  },
                  "On_facebook_leadsCount": {
                    "type": "string"
                  },
                  "Video_viewsCount": {
                    "type": "string"
                  },
                  "calculation_152": {
                    "type": "integer"
                  },
                  "device_platform": {
                    "type": "string"
                  },
                  "reporting_status_display": {
                    "type": "null"
                  }
                },
                "required": [
                  "device_platform",
                  "AvgreachCount",
                  "AvgfrequencyCount",
                  "ImpressionCount",
                  "CpmCount",
                  "Inline_link_clickCount",
                  "CpcLinkCount",
                  "CtrLinkCount",
                  "calculation_152",
                  "Video_viewsCount",
                  "On_facebook_leadsCount",
                  "Offsite_leadCount",
                  "reporting_status_display"
                ],
                "type": "object"
              },
              "type": "array"
            },
            "iTotalDisplayRecords": {
              "type": "integer"
            },
            "iTotalRecords": {
              "type": "integer"
            },
            "sEcho": {
              "type": "string"
            }
          },
          "required": [
            "sEcho",
            "iTotalRecords",
            "iTotalDisplayRecords",
            "aaData"
          ],
          "type": "object"
        }
      ]
    },
    "error": {
      "type": "boolean"
    },
    "query_id": {
      "format": "uuid",
      "type": "string"
    },
    "status": {
      "type": "integer"
    },
    "total_data": {
      "items": {
        "properties": {
          "AvgfrequencyCount": {
            "type": "string"
          },
          "AvgreachCount": {
            "type": "string"
          },
          "CpcLinkCount": {
            "type": "string"
          },
          "CpmCount": {
            "type": "string"
          },
          "CtrLinkCount": {
            "type": "string"
          },
          "ImpressionCount": {
            "type": "string"
          },
          "Inline_link_clickCount": {
            "type": "string"
          },
          "Offsite_leadCount": {
            "type": "string"
          },
          "On_facebook_leadsCount": {
            "type": "string"
          },
          "Video_viewsCount": {
            "type": "string"
          },
          "account_id": {
            "type": "string"
          },
          "account_name": {
            "type": "string"
          },
          "adgroup_name": {
            "type": "string"
          },
          "adgroup_status": {
            "type": "string"
          },
          "adset_name": {
            "type": "string"
          },
          "billing_event_adset": {
            "type": "string"
          },
          "buying_type": {
            "type": "string"
          },
          "calculation_152": {
            "type": "integer"
          },
          "campaign_customer_id": {
            "type": "string"
          },
          "campaign_id": {
            "type": "string"
          },
          "campaign_name": {
            "type": "string"
          },
          "device_platform": {
            "type": "string"
          },
          "facebook_adgroup_id": {
            "type": "string"
          },
          "facebook_adset_id": {
            "type": "string"
          },
          "objective_campaign": {
            "type": "string"
          },
          "optimization_goal_adset": {
            "type": "string"
          },
          "reporting_status_display": {
            "type": "null"
          }
        },
        "required": [
          "device_platform",
          "AvgreachCount",
          "AvgfrequencyCount",
          "ImpressionCount",
          "CpmCount",
          "Inline_link_clickCount",
          "CpcLinkCount",
          "CtrLinkCount",
          "calculation_152",
          "Video_viewsCount",
          "On_facebook_leadsCount",
          "Offsite_leadCount",
          "adgroup_name",
          "adgroup_status",
          "facebook_adgroup_id",
          "adset_name",
          "facebook_adset_id",
          "optimization_goal_adset",
          "billing_event_adset",
          "campaign_name",
          "objective_campaign",
          "campaign_customer_id",
          "account_id",
          "account_name",
          "campaign_id",
          "buying_type",
          "reporting_status_display"
        ],
        "type": "object"
      },
      "type": "array"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "query_id",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": [
    {
      "ClickCount": "8",
      "advertising_channel_type": "SEARCH",
      "calculation_286": "Google Search",
      "device_id": "5114273",
      "name": "DESKTOP",
      "network": "SEARCH",
      "reporting_status_display": null
    },
    {
      "ClickCount": "9",
      "advertising_channel_type": "SEARCH",
      "calculation_286": "Google Search",
      "device_id": "5114277",
      "name": "MOBILE",
      "network": "SEARCH",
      "reporting_status_display": null
    }
  ],
  "error": false,
  "query_id": "0f7bbb64-9461-4161-ab8b-bab306f02ce7",
  "status": 200,
  "warnings": []
}
```

**Bindings** (20)

- `query filter_set_id` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.2267.widgets.40734.metadata.filter_set_id` (seen 1x)
- `query groupby` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.2267.widgets.40734.metadata.data_columns.grouped[0].field` (seen 2x)
- `query widget_request` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[144]` (seen 1x)
- `query widget_type` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.125.widgets.8379.type` (seen 2x)
- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 5x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 5x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 5x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 5x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 5x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 5x)
- `cookie adminhtml` comes from `GET /server/api/services/{serviceId}/data/cgn` `set-cookie adminhtml` (seen 2x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 5x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 5x)
- `query filter_set_id` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.2267.widgets.40747.metadata.filter_set_id` (seen 1x)
- `query widget_request` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[154]` (seen 1x)
- `query groupby` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.1592.widgets.29435.metadata.data_columns.selected[0].field` (seen 3x)
- `query widget_request` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[136]` (seen 3x)
- `query widget_type` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.1592.widgets.29433.type` (seen 3x)
- `cookie adminhtml` comes from `GET /server/api/services/{serviceId}/data/adgroupcgn` `set-cookie adminhtml` (seen 3x)
- `set-cookie adminhtml` feeds `GET /server/api/dash/widgets/{widgetId}/data` `cookie adminhtml`

**Observed in** (5)

- YP Metrics tour, step `tab-sem`, run `20261104T214824Z-f674`, 2026-11-04T21:54:57.172Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1131:0`
- YP Metrics tour, step `tab-sem`, run `20261104T214824Z-f674`, 2026-11-04T21:54:57.198Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1140:0`
- YP Metrics tour, step `tab-facebook-ads-management`, run `20261104T214824Z-f674`, 2026-11-04T21:55:20.291Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1191:0`
- YP Metrics tour, step `range-30-days`, run `20261104T214824Z-f674`, 2026-11-04T21:55:37.691Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1209:0`
- YP Metrics tour, step `range-last-month`, run `20261104T214824Z-f674`, 2026-11-04T21:55:59.132Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1227:0`

### `GET /server/api/services/{serviceId}/data/genderagescgn`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `serviceId` | path | literal | `39` | yes |
| `query_id` | query | computed | `157f9643-2182-43d0-8673-16d8b1082aa1` | yes |
| `daterange` | query | literal | `2026-10-28\|2026-11-03` | yes |
| `fields` | query | binding | `ImpressionCount` | yes |
| `groupby` | query | binding | `gender` | yes |
| `widget_request` | query | binding | `29431` | yes |
| `widget_type` | query | binding | `piechart` | yes |
| `widget_page_id` | query | literal | `92` | yes |
| `sort` | query | literal | `age` | no |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "items": {
        "properties": {
          "ImpressionCount": {
            "type": "string"
          },
          "age": {
            "type": "string"
          },
          "gender": {
            "type": "string"
          },
          "genderages_id": {
            "type": "string"
          },
          "reporting_status_display": {
            "type": "null"
          }
        },
        "required": [
          "gender",
          "ImpressionCount",
          "reporting_status_display"
        ],
        "type": "object"
      },
      "type": "array"
    },
    "error": {
      "type": "boolean"
    },
    "query_id": {
      "format": "uuid",
      "type": "string"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "query_id",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": [
    {
      "ImpressionCount": "2913",
      "gender": "female",
      "reporting_status_display": null
    },
    {
      "ImpressionCount": "5577",
      "gender": "male",
      "reporting_status_display": null
    }
  ],
  "error": false,
  "query_id": "157f9643-2182-43d0-8673-16d8b1082aa1",
  "status": 200,
  "warnings": []
}
```

**Bindings** (21)

- `query fields` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.1592.widgets.29430.metadata.data_columns.selected[2].field` (seen 3x)
- `query groupby` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.1592.widgets.29431.metadata.data_columns.grouped[0].field` (seen 3x)
- `query widget_request` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[132]` (seen 3x)
- `query widget_type` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.125.widgets.8379.type` (seen 1x)
- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 6x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 6x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 6x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 6x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 6x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 6x)
- `cookie adminhtml` comes from `GET /server/api/dash/widgets/{widgetId}/data` `set-cookie adminhtml` (seen 1x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 6x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 6x)
- `query widget_request` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[133]` (seen 3x)
- `query widget_type` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.125.widgets.10570.type` (seen 1x)
- `cookie adminhtml` comes from `GET /server/api/services/{serviceId}/data/cgn` `set-cookie adminhtml` (seen 3x)
- `query widget_type` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.1592.widgets.29431.type` (seen 2x)
- `query widget_type` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.1592.widgets.29432.type` (seen 2x)
- `cookie adminhtml` comes from `GET /server/api/services/{serviceId}/data/genderagescgn` `set-cookie adminhtml` (seen 2x)
- `set-cookie adminhtml` feeds `GET /server/api/services/{serviceId}/data/cgn` `cookie adminhtml`
- and 1 more

**Observed in** (6)

- YP Metrics tour, step `tab-facebook-ads-management`, run `20261104T214824Z-f674`, 2026-11-04T21:55:15.288Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1185:0`
- YP Metrics tour, step `tab-facebook-ads-management`, run `20261104T214824Z-f674`, 2026-11-04T21:55:18.286Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1187:0`
- YP Metrics tour, step `range-30-days`, run `20261104T214824Z-f674`, 2026-11-04T21:55:37.690Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1205:0`
- YP Metrics tour, step `range-30-days`, run `20261104T214824Z-f674`, 2026-11-04T21:55:37.690Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1206:0`
- YP Metrics tour, step `range-last-month`, run `20261104T214824Z-f674`, 2026-11-04T21:55:59.131Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1223:0`
- YP Metrics tour, step `range-last-month`, run `20261104T214824Z-f674`, 2026-11-04T21:55:59.131Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1224:0`

### `GET /server/api/services/{serviceId}/data/keyword`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `serviceId` | path | literal | `34` | yes |
| `query_id` | query | computed | `482495d1-d84f-4bb4-9496-ec1b81895ce7` | unknown |
| `daterange` | query | literal | `2026-10-28\|2026-11-03` | unknown |
| `filter_set_id` | query | binding | `5016` | unknown |
| `fields` | query | literal | `name,ImpressionCount,ClickCount,AverageCPC,name` | unknown |
| `aggregate` | query | literal | `false` | unknown |
| `datatable` | query | literal | `true` | unknown |
| `page` | query | literal | `0,10` | unknown |
| `sort` | query | literal | `-ClickCount` | unknown |
| `groupby` | query | binding | `keyword_id` | unknown |
| `widget_request` | query | binding | `40738` | unknown |
| `widget_type` | query | binding | `datagrid` | unknown |
| `widget_page_id` | query | literal | `92` | unknown |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "properties": {
        "aaData": {
          "items": {
            "properties": {
              "AverageCPC": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "ClickCount": {
                "type": "string"
              },
              "ImpressionCount": {
                "type": "string"
              },
              "advertising_channel_type": {
                "type": "string"
              },
              "calculation_288": {
                "type": "string"
              },
              "keyword_id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "network": {
                "type": "string"
              },
              "reporting_status_display": {
                "type": "null"
              }
            },
            "required": [
              "keyword_id",
              "name",
              "ImpressionCount",
              "ClickCount",
              "AverageCPC",
              "calculation_288",
              "advertising_channel_type",
              "network",
              "reporting_status_display"
            ],
            "type": "object"
          },
          "type": "array"
        },
        "iTotalDisplayRecords": {
          "type": "integer"
        },
        "iTotalRecords": {
          "type": "integer"
        },
        "sEcho": {
          "type": "string"
        }
      },
      "required": [
        "sEcho",
        "iTotalRecords",
        "iTotalDisplayRecords",
        "aaData"
      ],
      "type": "object"
    },
    "error": {
      "type": "boolean"
    },
    "query_id": {
      "format": "uuid",
      "type": "string"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "query_id",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": {
    "aaData": [
      {
        "AverageCPC": "7.38125",
        "ClickCount": "8",
        "ImpressionCount": "63",
        "advertising_channel_type": "SEARCH",
        "calculation_288": "Google Search",
        "keyword_id": "{redacted}",
        "name": "Roof Repairs",
        "network": "SEARCH",
        "reporting_status_display": null
      },
      {
        "AverageCPC": "9.096666667",
        "ClickCount": "6",
        "ImpressionCount": "148",
        "advertising_channel_type": "SEARCH",
        "calculation_288": "Google Search",
        "keyword_id": "{redacted}",
        "name": "Residential Roofing",
        "network": "SEARCH",
        "reporting_status_display": null
      }
    ],
    "iTotalDisplayRecords": 18,
    "iTotalRecords": 10,
    "sEcho": "prod"
  },
  "error": false,
  "query_id": "482495d1-d84f-4bb4-9496-ec1b81895ce7",
  "status": 200,
  "warnings": []
}
```

**Bindings** (14)

- `query filter_set_id` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.2267.widgets.40738.metadata.filter_set_id` (seen 1x)
- `query groupby` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.2267.widgets.40738.metadata.data_columns.selected[0].groupby_id_field` (seen 1x)
- `query widget_request` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.widget_ids[146]` (seen 1x)
- `query widget_type` comes from `GET /server/api/dash/{dashId}` `response.body $.data.page.layouts.2267.widgets.40735.type` (seen 1x)
- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 1x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 1x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 1x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 1x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 1x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 1x)
- `cookie adminhtml` comes from `GET /server/api/services/{serviceId}/data/city` `set-cookie adminhtml` (seen 1x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 1x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/services/{serviceId}/data/cgnad` `cookie adminhtml`

**Observed in** (1)

- YP Metrics tour, step `tab-sem`, run `20261104T214824Z-f674`, 2026-11-04T21:55:00.611Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.1160:0`

### `GET /server/api/session/initUser`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `is_nui` | query | literal | `true` | yes |
| `query_id` | query | computed | `b8b366c5-47e2-4911-81be-d267e4708c98` | yes |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "properties": {
        "settings": {
          "properties": {
            "GTMkey": {
              "type": "string"
            },
            "account_manager_user_id": {
              "type": "null"
            },
            "agencySupportLink": {
              "type": "string"
            },
            "allow_tp_manual_status_changes": {
              "type": "boolean"
            },
            "applicationName": {
              "type": "string"
            },
            "availableFeatures": {
              "items": {
                "type": "string"
              },
              "type": "array"
            },
            "availableModules": {
              "items": {
                "type": "string"
              },
              "type": "array"
            },
            "bigNumberWidgetsUseThemeColor": {
              "type": "boolean"
            },
            "bigNumberWidgetsUseWhiteFontColor": {
              "type": "boolean"
            },
            "canAccessOldGoals": {
              "type": "boolean"
            },
            "canAccessOldMds": {
              "type": "boolean"
            },
            "canAccessQuickReport": {
              "type": "boolean"
            },
            "canAccessStellar": {
              "type": "boolean"
            },
            "canBUAdminManageServices": {
              "type": "boolean"
            },
            "canCreateScheduledReports": {
              "type": "boolean"
            },
            "canManageDashboards": {
              "type": "boolean"
            },
            "canManageServices": {
              "type": "null"
            },
            "canShowCustomFonts": {
              "type": "boolean"
            },
            "clientAudienceDetails": {
              "type": "null"
            },
            "clientName": {
              "type": "null"
            },
            "clientSupportLink": {
              "type": "string"
            },
            "clusterAdminSupportLink": {
              "type": "string"
            },
            "clusterId": {
              "type": "string"
            },
            "clusterIds": {
              "items": {
                "type": "string"
              },
              "type": "array"
            },
            "clusterName": {
              "type": "string"
            },
            "company": {
              "type": "string"
            },
            "companyNameFromSignup": {
              "type": "string"
            },
            "completedOnboardingSteps": {
              "items": {
                "type": "string"
              },
              "type": "array"
            },
            "currencyCode": {
              "type": "string"
            },
            "currencyCodeValue": {
              "type": "string"
            },
            "currentLogoUrl": {
              "format": "uri",
              "type": "string"
            },
            "currentThemeColor": {
              "type": "string"
            },
            "customWelcomeMessage": {
              "type": "string"
            },
            "customerInstanceURL": {
              "type": "null"
            },
            "darkLogoUrl": {
              "format": "uri",
              "type": "string"
            },
            "defaultLocale": {
              "type": "string"
            },
            "defaultNavFavorites": {
              "type": "boolean"
            },
            "deployBadge": {
              "type": "string"
            },
            "disableInactiveProductsFiltering": {
              "type": "boolean"
            },
            "disableUpdateDashboardButton": {
              "type": "boolean"
            },
            "ez_login_link_expiration_in_hours": {
              "type": "string"
            },
            "faviconUrl": {
              "type": "null"
            },
            "featurePackageName": {
              "type": "string"
            },
            "feedbackActive": {
              "type": "boolean"
            },
            "firstName": {
              "type": "string"
            },
            "googleLoginUrl": {
              "format": "uri",
              "type": "string"
            },
            "guides": {
              "type": "array"
            },
            "hasAccessToAudience2": {
              "type": "boolean"
            },
            "hasClientRecordGlobalFilters": {
              "type": "boolean"
            },
            "hasCustomTranslations": {
              "type": "boolean"
            },
            "hasDevTools": {
              "type": "boolean"
            },
            "hasTapReportsFreemiumPlatformSourceLimitation": {
              "type": "boolean"
            },
            "hideGuide": {
              "type": "boolean"
            },
            "hideInactiveServicesLeftNav": {
              "type": "boolean"
            },
            "hideSuperAdminSupportLink": {
              "type": "boolean"
            },
            "homePage": {
              "type": "string"
            },
            "impersonatorUser": {
              "type": "null"
            },
            "instanceStatus": {
              "type": "string"
            },
            "instanceTimezone": {
              "type": "string"
            },
            "instanceTimezoneDisplay": {
              "type": "string"
            },
            "instanceURL": {
              "type": "string"
            },
            "invoiceHandling": {
              "type": "string"
            },
            "ioRoleName": {
              "type": "null"
            },
            "ioRolePermissions": {
              "type": "null"
            },
            "isAdfloNativeReportingEnabled": {
              "type": "boolean"
            },
            "isAdtaxiInstance": {
              "type": "boolean"
            },
            "isAnalyticsRoute": {
              "type": "boolean"
            },
            "isAutopilotOnboardingFlow": {
              "type": "boolean"
            },
            "isClassicAngularAllowed": {
              "type": "boolean"
            },
            "isClustersSupportEnabled": {
              "type": "boolean"
            },
            "isCurrentUserPredefinedSuperAdmin": {
              "type": "boolean"
            },
            "isDashboardGenerated": {
              "type": "boolean"
            },
            "isDcpSwitch": {
              "type": "boolean"
            },
            "isDevelopmentServer": {
              "type": "boolean"
            },
            "isExternalDestinationEnabled": {
              "type": "boolean"
            },
            "isFrameMode": {
              "type": "boolean"
            },
            "isFreeTrial": {
              "type": "boolean"
            },
            "isGoalsForAgentsEnabled": {
              "type": "boolean"
            },
            "isGoogleLoginEnabled": {
              "type": "boolean"
            },
            "isHipaaInstance": {
              "type": "boolean"
            },
            "isIOAuthorized": {
              "type": "boolean"
            },
            "isIOHomePage": {
              "type": "boolean"
            },
            "isIORoute": {
              "type": "boolean"
            },
            "isImpersonationMode": {
              "type": "boolean"
            },
            "isLocalInstance": {
              "type": "boolean"
            },
            "isLoggedIn": {
              "type": "boolean"
            },
            "isMarketplaceCentralizedInstance": {
              "type": "boolean"
            },
            "isOldUiDisabled": {
              "type": "boolean"
            },
            "isOnSupBilling": {
              "type": "boolean"
            },
            "isOnSupBillingCustomPlan": {
              "type": "boolean"
            },
            "isOnboarding": {
              "type": "boolean"
            },
            "isOnboardingCompleted": {
              "type": "boolean"
            },
            "isProductionServer": {
              "type": "boolean"
            },
            "isRemoteLogin": {
              "type": "boolean"
            },
            "isRevLocalInstance": {
              "type": "boolean"
            },
            "isRunningDbUpdate": {
              "type": "boolean"
            },
            "isSelfRegistrationEnable": {
              "type": "boolean"
            },
            "isSmartCampaignFilteringEnabled": {
              "type": "boolean"
            },
            "isStagingServer": {
              "type": "boolean"
            },
            "isTestdriveInstance": {
              "type": "boolean"
            },
            "is_order_management_mode_enabled": {
              "type": "boolean"
            },
            "landingPageState": {
              "type": "string"
            },
            "lastName": {
              "type": "string"
            },
            "lightLogoUrl": {
              "format": "uri",
              "type": "string"
            },
            "locale": {
              "type": "string"
            },
            "localesSupported": {
              "properties": {
                "en_US": {
                  "properties": {
                    "label": {
                      "type": "string"
                    },
                    "plurals": {
                      "type": "integer"
                    }
                  },
                  "required": [
                    "plurals",
                    "label"
                  ],
                  "type": "object"
                },
                "es_ES": {
                  "properties": {
                    "label": {
                      "type": "string"
                    },
                    "plurals": {
                      "type": "integer"
                    }
                  },
                  "required": [
                    "plurals",
                    "label"
                  ],
                  "type": "object"
                },
                "fr_CA": {
                  "properties": {
                    "label": {
                      "type": "string"
                    },
                    "plurals": {
                      "type": "integer"
                    }
                  },
                  "required": [
                    "plurals",
                    "label"
                  ],
                  "type": "object"
                },
                "hi_IN": {
                  "properties": {
                    "label": {
                      "type": "string"
                    },
                    "plurals": {
                      "type": "integer"
                    }
                  },
                  "required": [
                    "plurals",
                    "label"
                  ],
                  "type": "object"
                },
                "id_ID": {
                  "properties": {
                    "label": {
                      "type": "string"
                    },
                    "plurals": {
                      "type": "integer"
                    }
                  },
                  "required": [
                    "plurals",
                    "label"
                  ],
                  "type": "object"
                }
              },
              "required": [
                "en_US",
                "fr_CA",
                "hi_IN",
                "id_ID",
                "es_ES"
              ],
              "type": "object"
            },
            "minimumPasswordLength": {
              "type": "integer"
            },
            "neverExpiringPermalinksEnabled": {
              "type": "boolean"
            },
            "nuiLoginPageMessage": {
              "type": "string"
            },
            "onboardingStep": {
              "type": "integer"
            },
            "overrideLoginPageFooterText": {
              "type": "boolean"
            },
            "passwordRequirements": {
              "type": "string"
            },
            "platformSource": {
              "type": "string"
            },
            "preferredOnboardingFlow": {
              "type": "string"
            },
            "primaryThemeColor": {
              "type": "string"
            },
            "product_images_in_catalogue": {
              "type": "boolean"
            },
            "pubSubDetails": {
              "properties": {
                "pubsub_api_key": {
                  "type": "string"
                },
                "pubsub_auth_endpoint": {
                  "type": "string"
                },
                "pubsub_cluster": {
                  "type": "string"
                },
                "pubsub_instance_channel": {
                  "type": "string"
                },
                "pubsub_presence_report_studio_prefix": {
                  "type": "string"
                },
                "pubsub_user_channel": {
                  "type": "string"
                }
              },
              "required": [
                "pubsub_user_channel",
                "pubsub_instance_channel",
                "pubsub_presence_report_studio_prefix",
                "pubsub_api_key",
                "pubsub_cluster",
                "pubsub_auth_endpoint"
              ],
              "type": "object"
            },
            "reportLanguage": {
              "type": "string"
            },
            "reportStudioShortcutsEnabled": {
              "type": "boolean"
            },
            "reportingProfileId": {
              "type": "string"
            },
            "reportingProfileName": {
              "type": "string"
            },
            "resellerBilling": {
              "type": "boolean"
            },
            "resellerName": {
              "type": "string"
            },
            "role": {
              "properties": {
                "can_impersonate_other_agents": {
                  "type": "boolean"
                },
                "can_manage_alerts": {
                  "type": "boolean"
                },
                "cluster_id": {
                  "type": "null"
                },
                "cluster_name": {
                  "type": "null"
                },
                "id": {
                  "type": "string"
                },
                "is_default": {
                  "type": "boolean"
                },
                "is_selectable": {
                  "type": "boolean"
                },
                "manage_dashboards": {
                  "type": "boolean"
                },
                "manage_report_studio": {
                  "type": "boolean"
                },
                "name": {
                  "type": "string"
                },
                "predefined_role_key": {
                  "type": "string"
                },
                "predefined_role_key_display": {
                  "type": "string"
                },
                "reporting_profile_ids": {
                  "type": "null"
                },
                "reporting_profile_permission": {
                  "type": "string"
                },
                "reporting_profile_permission_display": {
                  "type": "string"
                },
                "reporting_template_ids": {
                  "items": {
                    "type": "string"
                  },
                  "type": "array"
                },
                "role_association": {
                  "type": "string"
                },
                "role_association_display": {
                  "type": "string"
                },
                "role_permissions": {
                  "properties": {
                    "aiagent": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "aiagentcalculation": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "aiagentdashboard": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "aiagentreportstudio": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "alert": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "anomaly": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "app": {
                      "properties": {
                        "can_access_acorn": {
                          "type": "boolean"
                        },
                        "can_access_gds": {
                          "type": "boolean"
                        },
                        "can_access_ripley": {
                          "type": "boolean"
                        },
                        "can_access_sheets": {
                          "type": "boolean"
                        },
                        "can_access_tech_support_chatbot": {
                          "type": "boolean"
                        },
                        "can_access_zest": {
                          "type": "boolean"
                        },
                        "can_impersonate_other_agents": {
                          "type": "boolean"
                        },
                        "can_read_write": {
                          "type": "string"
                        },
                        "enable_adflo_proposal": {
                          "type": "boolean"
                        },
                        "enable_order_management": {
                          "type": "boolean"
                        }
                      },
                      "required": [
                        "can_access_acorn",
                        "can_access_gds",
                        "can_access_ripley",
                        "can_access_sheets",
                        "can_access_tech_support_chatbot",
                        "can_access_zest",
                        "can_impersonate_other_agents",
                        "can_read_write",
                        "enable_adflo_proposal",
                        "enable_order_management"
                      ],
                      "type": "object"
                    },
                    "audience": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "auditlog": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "billable": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "billing": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "billingconfig": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "calculation": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "campaign": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "cancellationreason": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "cataloguesetting": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        },
                        "can_read_write_catalogue_settings": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write",
                        "can_read_write_catalogue_settings"
                      ],
                      "type": "object"
                    },
                    "category": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "client": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "clientcalculations": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "clientcategory": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "clientgroup": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "cluster": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "clusteraccess": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "clustermember": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "columnpreferences": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "comment": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "competitorresearch": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "connectionstatus": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "contentset": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "creative": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        },
                        "can_read_write_creative_tag": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write",
                        "can_read_write_creative_tag"
                      ],
                      "type": "object"
                    },
                    "custombenchmark": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "customtranslation": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "dashboard": {
                      "properties": {
                        "can_edit_draw_options": {
                          "type": "boolean"
                        },
                        "can_edit_favorites": {
                          "type": "boolean"
                        },
                        "can_edit_reporting_options": {
                          "type": "boolean"
                        },
                        "can_publish_to_library": {
                          "type": "boolean"
                        },
                        "can_read_write": {
                          "type": "string"
                        },
                        "limit_dashboard_access_with_data_profile": {
                          "type": "boolean"
                        },
                        "manage_access_lists": {
                          "type": "boolean"
                        }
                      },
                      "required": [
                        "can_edit_draw_options",
                        "can_edit_favorites",
                        "can_edit_reporting_options",
                        "can_publish_to_library",
                        "can_read_write",
                        "limit_dashboard_access_with_data_profile",
                        "manage_access_lists"
                      ],
                      "type": "object"
                    },
                    "dashboardchatgptsummaries": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "dashboardexecutivesummaries": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "dashfolders": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "dataexporter": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "dataloadstatus": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "entityform": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "export": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "flight": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        },
                        "can_read_write_flight_cancel": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write",
                        "can_read_write_flight_cancel"
                      ],
                      "type": "object"
                    },
                    "goals": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "hintreports": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "importwizard": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        },
                        "can_read_write_manual_upload": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write",
                        "can_read_write_manual_upload"
                      ],
                      "type": "object"
                    },
                    "industrybenchmark": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "insightshq": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "ioexport": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "layout": {
                      "properties": {
                        "can_edit_draw_options": {
                          "type": "boolean"
                        },
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_edit_draw_options",
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "lead": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "leaddetails": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "leadnotes": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "leadnotification": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "lineitem": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        },
                        "can_read_write_line_item_cancel": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write",
                        "can_read_write_line_item_cancel"
                      ],
                      "type": "object"
                    },
                    "marginrule": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "mobileapp": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "namingconvention": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "note": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "oauth": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "oauthclusteraccess": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "objective": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "order": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        },
                        "can_read_write_order_cancel": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write",
                        "can_read_write_order_cancel"
                      ],
                      "type": "object"
                    },
                    "preference": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "product": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "proposal": {
                      "properties": {
                        "can_approve_reject_proposal": {
                          "type": "boolean"
                        },
                        "can_client_analysis": {
                          "type": "string"
                        },
                        "can_proposal_ai_recommendation": {
                          "type": "boolean"
                        },
                        "can_read_write": {
                          "type": "string"
                        },
                        "can_read_write_proposal_creation": {
                          "type": "boolean"
                        },
                        "can_read_write_proposal_line_item": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_approve_reject_proposal",
                        "can_client_analysis",
                        "can_proposal_ai_recommendation",
                        "can_read_write",
                        "can_read_write_proposal_creation",
                        "can_read_write_proposal_line_item"
                      ],
                      "type": "object"
                    },
                    "proposalexport": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "pushconnector": {
                      "properties": {
                        "can_datafusion": {
                          "type": "boolean"
                        },
                        "can_dfp": {
                          "type": "boolean"
                        },
                        "can_facebook_ads": {
                          "type": "boolean"
                        },
                        "can_google_ads": {
                          "type": "boolean"
                        },
                        "can_linkedin_ads": {
                          "type": "boolean"
                        }
                      },
                      "required": [
                        "can_datafusion",
                        "can_dfp",
                        "can_facebook_ads",
                        "can_google_ads",
                        "can_linkedin_ads"
                      ],
                      "type": "object"
                    },
                    "queue": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "quickreport": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "relationship": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "reportingprofile": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "reportingtemplate": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "reportstudio": {
                      "properties": {
                        "can_edit_favorites": {
                          "type": "boolean"
                        },
                        "can_publish_to_library": {
                          "type": "boolean"
                        },
                        "can_read_write": {
                          "type": "string"
                        },
                        "limit_report_studio_access_with_data_profile": {
                          "type": "boolean"
                        },
                        "manage_access_lists": {
                          "type": "boolean"
                        }
                      },
                      "required": [
                        "can_edit_favorites",
                        "can_publish_to_library",
                        "can_read_write",
                        "limit_report_studio_access_with_data_profile",
                        "manage_access_lists"
                      ],
                      "type": "object"
                    },
                    "reportstudiochatgptsummaries": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "reportstudioexecutivesummaries": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "role": {
                      "properties": {
                        "can_access_roles": {
                          "type": "string"
                        },
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_access_roles",
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "sales_config": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "sales_health": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "scheduledreport": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "serp": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "service": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "serviceclientmapping": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "servicelookup": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "servicesettings": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "siteauditor": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "smartcampaign": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "statuspage": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "stellarsetting": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "tag": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "tapoptimize": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "task": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        },
                        "can_read_write_workflow_task_due_date": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write",
                        "can_read_write_workflow_task_due_date"
                      ],
                      "type": "object"
                    },
                    "tasktag": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        },
                        "can_read_write_task_tag_assignment_access": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write",
                        "can_read_write_task_tag_assignment_access"
                      ],
                      "type": "object"
                    },
                    "tasktagconfig": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "tasktime": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "udb": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "user": {
                      "properties": {
                        "can_create_modify_users": {
                          "type": "string"
                        },
                        "can_impersonate_users": {
                          "type": "string"
                        },
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_create_modify_users",
                        "can_impersonate_users",
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "userimage": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "webhooks": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "website": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "widget": {
                      "properties": {
                        "can_edit_draw_options": {
                          "type": "boolean"
                        },
                        "can_edit_widget_alerts": {
                          "type": "boolean"
                        },
                        "can_edit_widget_annotations": {
                          "type": "boolean"
                        },
                        "can_read_write": {
                          "type": "string"
                        },
                        "can_read_write_filter_set": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_edit_draw_options",
                        "can_edit_widget_alerts",
                        "can_edit_widget_annotations",
                        "can_read_write",
                        "can_read_write_filter_set"
                      ],
                      "type": "object"
                    },
                    "workflowaction": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "workflowwebhookdestinations": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    },
                    "workflowwebhookinbound": {
                      "properties": {
                        "can_read_write": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "can_read_write"
                      ],
                      "type": "object"
                    }
                  },
                  "required": [
                    "aiagent",
                    "aiagentcalculation",
                    "aiagentdashboard",
                    "aiagentreportstudio",
                    "alert",
                    "anomaly",
                    "app",
                    "audience",
                    "auditlog",
                    "billable",
                    "billing",
                    "billingconfig",
                    "calculation",
                    "campaign",
                    "cancellationreason",
                    "cataloguesetting",
                    "category",
                    "client",
                    "clientcalculations",
                    "clientcategory",
                    "clientgroup",
                    "cluster",
                    "clusteraccess",
                    "clustermember",
                    "columnpreferences",
                    "comment",
                    "competitorresearch",
                    "connectionstatus",
                    "contentset",
                    "creative",
                    "custombenchmark",
                    "customtranslation",
                    "dashboard",
                    "dashboardchatgptsummaries",
                    "dashboardexecutivesummaries",
                    "dashfolders",
                    "dataexporter",
                    "dataloadstatus",
                    "entityform",
                    "export",
                    "flight",
                    "goals",
                    "hintreports",
                    "importwizard",
                    "industrybenchmark",
                    "insightshq",
                    "ioexport",
                    "layout",
                    "lead",
                    "leaddetails",
                    "leadnotes",
                    "leadnotification",
                    "lineitem",
                    "marginrule",
                    "mobileapp",
                    "namingconvention",
                    "note",
                    "oauth",
                    "oauthclusteraccess",
                    "objective",
                    "order",
                    "preference",
                    "product",
                    "proposal",
                    "proposalexport",
                    "pushconnector",
                    "queue",
                    "quickreport",
                    "relationship",
                    "reportingprofile",
                    "reportingtemplate",
                    "reportstudio",
                    "reportstudiochatgptsummaries",
                    "reportstudioexecutivesummaries",
                    "role",
                    "sales_config",
                    "sales_health",
                    "scheduledreport",
                    "serp",
                    "service",
                    "serviceclientmapping",
                    "servicelookup",
                    "servicesettings",
                    "siteauditor",
                    "smartcampaign",
                    "statuspage",
                    "stellarsetting",
                    "tag",
                    "tapoptimize",
                    "task",
                    "tasktag",
                    "tasktagconfig",
                    "tasktime",
                    "udb",
                    "user",
                    "userimage",
                    "webhooks",
                    "website",
                    "widget",
                    "workflowaction",
                    "workflowwebhookdestinations",
                    "workflowwebhookinbound"
                  ],
                  "type": "object"
                },
                "role_type": {
                  "type": "string"
                },
                "role_type_display": {
                  "type": "string"
                },
                "scheduled_report_permission": {
                  "type": "string"
                },
                "scheduled_report_permission_display": {
                  "type": "string"
                },
                "user_type": {
                  "type": "string"
                },
                "user_type_display": {
                  "type": "string"
                }
              },
              "required": [
                "id",
                "name",
                "predefined_role_key",
                "role_type",
                "role_association",
                "cluster_id",
                "reporting_template_ids",
                "reporting_profile_permission",
                "reporting_profile_ids",
                "scheduled_report_permission",
                "manage_dashboards",
                "manage_report_studio",
                "can_manage_alerts",
                "can_impersonate_other_agents",
                "role_permissions",
                "user_type",
                "is_default",
                "is_selectable",
                "cluster_name",
                "predefined_role_key_display",
                "user_type_display",
                "scheduled_report_permission_display",
                "reporting_profile_permission_display",
                "role_association_display",
                "role_type_display"
              ],
              "type": "object"
            },
            "secondaryThemeColor": {
              "type": "string"
            },
            "sheetsSelfServePlanId": {
              "type": "string"
            },
            "shouldHideTapClicksBranding": {
              "type": "boolean"
            },
            "showCategoriesOverview": {
              "type": "boolean"
            },
            "showComparisonArrows": {
              "type": "boolean"
            },
            "showDataFreshnessDate": {
              "type": "boolean"
            },
            "showDefaultComparisonArrowColor": {
              "type": "boolean"
            },
            "showDrilldownsWhenOverviewDisabled": {
              "type": "boolean"
            },
            "showOnboardingMenu": {
              "type": "boolean"
            },
            "showPredefinedCategoryDashboards": {
              "type": "string"
            },
            "showScheduledReports": {
              "type": "boolean"
            },
            "showScores": {
              "type": "boolean"
            },
            "showServiceDrilldowns": {
              "type": "boolean"
            },
            "showServicesOverview": {
              "type": "boolean"
            },
            "smartCampaignsEnabled": {
              "type": "boolean"
            },
            "statusMessage": {
              "type": [
                "string",
                "null"
              ]
            },
            "supportEmail": {
              "format": "email",
              "type": "string"
            },
            "tapCoreStack": {
              "type": "string"
            },
            "theme": {
              "type": "string"
            },
            "themeType": {
              "type": "string"
            },
            "type": {
              "type": "string"
            },
            "typeDisplayName": {
              "type": "string"
            },
            "usageLimits": {
              "properties": {
                "smartslides": {
                  "properties": {
                    "billable_product_code": {
                      "type": "string"
                    },
                    "feature_code": {
                      "type": "string"
                    },
                    "feature_name": {
                      "type": "string"
                    },
                    "types": {
                      "properties": {
                        "smartslides_generations": {
                          "properties": {
                            "custom_allocation_quantity": {
                              "type": "integer"
                            },
                            "cycle_additions_quantity": {
                              "type": "integer"
                            },
                            "default_plan": {
                              "properties": {
                                "ceiling_quantity": {
                                  "type": "integer"
                                },
                                "code": {
                                  "type": "string"
                                },
                                "effective_default_quantity": {
                                  "type": "integer"
                                },
                                "floor_quantity": {
                                  "type": "integer"
                                },
                                "is_dynamic": {
                                  "type": "boolean"
                                },
                                "name": {
                                  "type": "string"
                                }
                              },
                              "required": [
                                "code",
                                "name",
                                "is_dynamic",
                                "floor_quantity",
                                "ceiling_quantity",
                                "effective_default_quantity"
                              ],
                              "type": "object"
                            },
                            "is_enabled": {
                              "type": "boolean"
                            },
                            "total_effective_limit": {
                              "type": "integer"
                            },
                            "type_code": {
                              "type": "string"
                            },
                            "type_name": {
                              "type": "string"
                            }
                          },
                          "required": [
                            "type_code",
                            "type_name",
                            "is_enabled",
                            "default_plan",
                            "custom_allocation_quantity",
                            "cycle_additions_quantity",
                            "total_effective_limit"
                          ],
                          "type": "object"
                        }
                      },
                      "required": [
                        "smartslides_generations"
                      ],
                      "type": "object"
                    }
                  },
                  "required": [
                    "feature_code",
                    "feature_name",
                    "billable_product_code",
                    "types"
                  ],
                  "type": "object"
                }
              },
              "required": [
                "smartslides"
              ],
              "type": "object"
            },
            "useRecaptcha": {
              "type": "boolean"
            },
            "use_places_api_for_company_name": {
              "type": "boolean"
            },
            "user": {
              "properties": {
                "additional_details_1": {
                  "type": "string"
                },
                "additional_details_2": {
                  "type": "string"
                },
                "additional_details_3": {
                  "type": "string"
                },
                "address_1": {
                  "type": "string"
                },
                "address_2": {
                  "type": "string"
                },
                "can_access_new_report_studio": {
                  "type": "boolean"
                },
                "can_access_nui": {
                  "type": "boolean"
                },
                "city": {
                  "type": "string"
                },
                "client_group_id": {
                  "type": "string"
                },
                "client_group_name": {
                  "type": "string"
                },
                "client_id": {
                  "type": "null"
                },
                "client_name": {
                  "type": "null"
                },
                "client_reporting_status": {
                  "type": "null"
                },
                "cluster_id": {
                  "type": "string"
                },
                "cluster_is_cluster_group": {
                  "type": "boolean"
                },
                "cluster_name": {
                  "type": "string"
                },
                "company_name": {
                  "type": "string"
                },
                "country": {
                  "type": "string"
                },
                "country_display": {
                  "type": "string"
                },
                "created_by_user": {
                  "format": "email",
                  "type": "string"
                },
                "created_by_user_id": {
                  "type": "string"
                },
                "creation_time": {
                  "type": "integer"
                },
                "default_home_page": {
                  "type": "null"
                },
                "default_home_page_display": {
                  "type": "null"
                },
                "display_id": {
                  "type": "string"
                },
                "display_name": {
                  "type": "string"
                },
                "email": {
                  "format": "email",
                  "type": "string"
                },
                "enable_gds_module": {
                  "type": "boolean"
                },
                "enable_io_tool_module": {
                  "type": "boolean"
                },
                "enable_lead_management_module": {
                  "type": "boolean"
                },
                "enable_planner_module": {
                  "type": "boolean"
                },
                "enable_sheets_module": {
                  "type": "boolean"
                },
                "enable_stellar_module": {
                  "type": "boolean"
                },
                "enable_tap_gpt_module": {
                  "type": "boolean"
                },
                "external_user_id": {
                  "type": "null"
                },
                "first_login": {
                  "type": "integer"
                },
                "first_name": {
                  "type": "string"
                },
                "formatted_creation_time": {
                  "type": "string"
                },
                "formatted_first_login": {
                  "type": "string"
                },
                "formatted_last_login_timestamp": {
                  "type": "string"
                },
                "granular_permissions_by_entity": {
                  "type": "array"
                },
                "has_dark_logo": {
                  "type": "boolean"
                },
                "has_light_logo": {
                  "type": "boolean"
                },
                "hipaa_acknowledgement_timestamp": {
                  "type": "null"
                },
                "id": {
                  "type": "string"
                },
                "io_tool_extended_absence": {
                  "type": "boolean"
                },
                "io_tool_notification_frequency": {
                  "type": "null"
                },
                "io_tool_notification_own_activity": {
                  "type": "boolean"
                },
                "io_tool_queue_ids": {
                  "type": "null"
                },
                "io_tool_role_id": {
                  "type": "null"
                },
                "io_tool_role_is_accessible": {
                  "type": "boolean"
                },
                "io_tool_role_name": {
                  "type": "null"
                },
                "io_tool_use_in_out_status": {
                  "type": "boolean"
                },
                "last_login_timestamp": {
                  "type": "integer"
                },
                "last_name": {
                  "type": "string"
                },
                "lead_notification_frequency": {
                  "type": "string"
                },
                "lead_notification_frequency_display": {
                  "type": "string"
                },
                "login_count": {
                  "type": "string"
                },
                "nui_feedback": {
                  "type": "null"
                },
                "override_dashboard_page_ids": {
                  "type": "null"
                },
                "override_dashboard_pages_from_reporting_profile": {
                  "type": "boolean"
                },
                "phone": {
                  "type": "string"
                },
                "planner_id": {
                  "type": "null"
                },
                "report_language": {
                  "type": "string"
                },
                "report_language_display": {
                  "type": "string"
                },
                "reporting_profile_id": {
                  "type": "string"
                },
                "reporting_profile_name": {
                  "type": "string"
                },
                "role_id": {
                  "type": "string"
                },
                "role_is_accessible": {
                  "type": "boolean"
                },
                "role_name": {
                  "type": "string"
                },
                "role_predefined_role_key": {
                  "type": "string"
                },
                "show_categories_overview": {
                  "type": "string"
                },
                "show_categories_overview_display": {
                  "type": "string"
                },
                "show_services_overview": {
                  "type": "string"
                },
                "show_services_overview_display": {
                  "type": "string"
                },
                "show_welcome_modal": {
                  "type": "boolean"
                },
                "state": {
                  "type": "string"
                },
                "status": {
                  "type": "string"
                },
                "status_display": {
                  "type": "string"
                },
                "timezone": {
                  "type": "string"
                },
                "timezone_display": {
                  "type": "string"
                },
                "two_step_verification_enabled": {
                  "type": "boolean"
                },
                "use_nui": {
                  "type": "boolean"
                },
                "use_sup_goals": {
                  "type": "boolean"
                },
                "user_image_id": {
                  "type": "null"
                },
                "user_image_metadata": {
                  "type": "null"
                },
                "user_type": {
                  "type": "string"
                },
                "user_type_display": {
                  "type": "string"
                },
                "zip": {
                  "type": "string"
                }
              },
              "required": [
                "id",
                "client_id",
                "user_type",
                "company_name",
                "first_name",
                "last_name",
                "address_1",
                "address_2",
                "city",
                "state",
                "zip",
                "phone",
                "email",
                "cluster_id",
                "external_user_id",
                "additional_details_1",
                "additional_details_2",
                "additional_details_3",
                "enable_io_tool_module",
                "enable_lead_management_module",
                "lead_notification_frequency",
                "has_light_logo",
                "has_dark_logo",
                "override_dashboard_pages_from_reporting_profile",
                "default_home_page",
                "io_tool_notification_frequency",
                "io_tool_notification_own_activity",
                "country",
                "timezone",
                "status",
                "hipaa_acknowledgement_timestamp",
                "creation_time",
                "created_by_user_id",
                "created_by_user",
                "report_language",
                "last_login_timestamp",
                "show_welcome_modal",
                "enable_gds_module",
                "enable_sheets_module",
                "enable_stellar_module",
                "show_services_overview",
                "show_categories_overview",
                "role_id",
                "io_tool_role_id",
                "client_group_id",
                "reporting_profile_id",
                "use_nui",
                "can_access_nui",
                "nui_feedback",
                "use_sup_goals",
                "io_tool_use_in_out_status",
                "enable_planner_module",
                "enable_tap_gpt_module",
                "first_login",
                "login_count",
                "planner_id",
                "two_step_verification_enabled",
                "can_access_new_report_studio",
                "client_name",
                "client_reporting_status",
                "cluster_name",
                "cluster_is_cluster_group",
                "override_dashboard_page_ids",
                "io_tool_queue_ids",
                "role_name",
                "io_tool_role_name",
                "client_group_name",
                "reporting_profile_name",
                "user_image_id",
                "user_image_metadata",
                "display_name",
                "display_id",
                "show_services_overview_display",
                "show_categories_overview_display",
                "user_type_display",
                "io_tool_role_is_accessible",
                "role_is_accessible",
                "role_predefined_role_key",
                "io_tool_extended_absence",
                "formatted_first_login",
                "lead_notification_frequency_display",
                "formatted_last_login_timestamp",
                "report_language_display",
                "formatted_creation_time",
                "status_display",
                "timezone_display",
                "country_display",
                "default_home_page_display",
                "granular_permissions_by_entity"
              ],
              "type": "object"
            },
            "userDisplayName": {
              "type": "string"
            },
            "userEmail": {
              "format": "email",
              "type": "string"
            },
            "userId": {
              "type": "string"
            },
            "userImageId": {
              "type": "null"
            },
            "userImageMetadata": {
              "type": "null"
            },
            "weekStartsOnMonday": {
              "type": "boolean"
            },
            "whitelabelClusterId": {
              "type": "null"
            },
            "whitelabelClusterIdsByServerName": {
              "type": "array"
            }
          },
          "required": [
            "isLoggedIn",
            "isImpersonationMode",
            "localesSupported",
            "defaultLocale",
            "locale",
            "hasCustomTranslations",
            "currentLogoUrl",
            "passwordRequirements",
            "minimumPasswordLength",
            "applicationName",
            "whitelabelClusterId",
            "nuiLoginPageMessage",
            "customWelcomeMessage",
            "faviconUrl",
            "shouldHideTapClicksBranding",
            "theme",
            "themeType",
            "primaryThemeColor",
            "secondaryThemeColor",
            "currentThemeColor",
            "isGoogleLoginEnabled",
            "googleLoginUrl",
            "supportEmail",
            "isSelfRegistrationEnable",
            "overrideLoginPageFooterText",
            "hideGuide",
            "isRunningDbUpdate",
            "isOldUiDisabled",
            "landingPageState",
            "type",
            "typeDisplayName",
            "firstName",
            "lastName",
            "userId",
            "userDisplayName",
            "userEmail",
            "clientName",
            "instanceURL",
            "ioRoleName",
            "ioRolePermissions",
            "canManageDashboards",
            "canManageServices",
            "canBUAdminManageServices",
            "clusterIds",
            "clusterId",
            "clusterName",
            "company",
            "currencyCodeValue",
            "currencyCode",
            "reportLanguage",
            "instanceStatus",
            "isIOAuthorized",
            "isAnalyticsRoute",
            "isIORoute",
            "isFreeTrial",
            "isRemoteLogin",
            "lightLogoUrl",
            "darkLogoUrl",
            "availableFeatures",
            "canAccessOldMds",
            "feedbackActive",
            "bigNumberWidgetsUseThemeColor",
            "bigNumberWidgetsUseWhiteFontColor",
            "hideInactiveServicesLeftNav",
            "isDevelopmentServer",
            "hasDevTools",
            "isStagingServer",
            "tapCoreStack",
            "isLocalInstance",
            "isProductionServer",
            "isAdtaxiInstance",
            "isRevLocalInstance",
            "isHipaaInstance",
            "reportingProfileId",
            "reportingProfileName",
            "showScores",
            "showServicesOverview",
            "showCategoriesOverview",
            "showDataFreshnessDate",
            "showServiceDrilldowns",
            "showDrilldownsWhenOverviewDisabled",
            "showComparisonArrows",
            "reportStudioShortcutsEnabled",
            "showScheduledReports",
            "showDefaultComparisonArrowColor",
            "clusterAdminSupportLink",
            "agencySupportLink",
            "clientSupportLink",
            "showPredefinedCategoryDashboards",
            "hideSuperAdminSupportLink",
            "isFrameMode",
            "canCreateScheduledReports",
            "statusMessage",
            "ez_login_link_expiration_in_hours",
            "userImageId",
            "userImageMetadata",
            "account_manager_user_id",
            "featurePackageName",
            "platformSource",
            "hasTapReportsFreemiumPlatformSourceLimitation",
            "impersonatorUser",
            "role",
            "user",
            "homePage",
            "isIOHomePage",
            "isDcpSwitch",
            "deployBadge",
            "pubSubDetails",
            "guides",
            "invoiceHandling",
            "canAccessOldGoals",
            "product_images_in_catalogue",
            "is_order_management_mode_enabled",
            "resellerBilling",
            "resellerName",
            "disableUpdateDashboardButton",
            "canAccessStellar",
            "sheetsSelfServePlanId",
            "defaultNavFavorites",
            "isCurrentUserPredefinedSuperAdmin",
            "hasAccessToAudience2",
            "allow_tp_manual_status_changes",
            "companyNameFromSignup",
            "isAutopilotOnboardingFlow",
            "preferredOnboardingFlow",
            "isOnboardingCompleted",
            "canAccessQuickReport",
            "isSmartCampaignFilteringEnabled",
            "smartCampaignsEnabled",
            "isExternalDestinationEnabled",
            "whitelabelClusterIdsByServerName",
            "availableModules",
            "isClassicAngularAllowed",
            "neverExpiringPermalinksEnabled",
            "hasClientRecordGlobalFilters",
            "isDashboardGenerated",
            "GTMkey",
            "canShowCustomFonts",
            "isGoalsForAgentsEnabled",
            "isAdfloNativeReportingEnabled",
            "isClustersSupportEnabled",
            "weekStartsOnMonday",
            "isOnSupBilling",
            "isOnSupBillingCustomPlan",
            "instanceTimezone",
            "instanceTimezoneDisplay",
            "isTestdriveInstance",
            "disableInactiveProductsFiltering",
            "customerInstanceURL",
            "clientAudienceDetails",
            "isMarketplaceCentralizedInstance",
            "use_places_api_for_company_name",
            "usageLimits",
            "isOnboarding",
            "onboardingStep",
            "completedOnboardingSteps",
            "showOnboardingMenu",
            "useRecaptcha"
          ],
          "type": "object"
        }
      },
      "required": [
        "settings"
      ],
      "type": "object"
    },
    "error": {
      "type": "boolean"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": {
    "settings": {
      "GTMkey": "{redacted}",
      "account_manager_user_id": null,
      "agencySupportLink": "",
      "allow_tp_manual_status_changes": false,
      "applicationName": "YP Metrics - PJ Métriques",
      "availableFeatures": [
        "alerts",
        "categories"
      ],
      "availableModules": [
        "adflo_proposal_plg",
        "ai_agent_scheduled_reports"
      ],
      "bigNumberWidgetsUseThemeColor": false,
      "bigNumberWidgetsUseWhiteFontColor": true,
      "canAccessOldGoals": false,
      "canAccessOldMds": true,
      "canAccessQuickReport": true,
      "canAccessStellar": false,
      "canBUAdminManageServices": true,
      "canCreateScheduledReports": true,
      "canManageDashboards": false,
      "canManageServices": null,
      "canShowCustomFonts": false,
      "clientAudienceDetails": null,
      "clientName": null,
      "clientSupportLink": "",
      "clusterAdminSupportLink": "",
      "clusterId": "1",
      "clusterIds": [
        "1"
      ],
      "clusterName": "YP Canada",
      "company": "Everett Knight",
      "companyNameFromSignup": "YPCanada",
      "completedOnboardingSteps": [
        "connect_data",
        "analyze"
      ],
      "currencyCode": "{redacted}",
      "currencyCodeValue": "{redacted}",
      "currentLogoUrl": "https://mymetrics.yp.ca/app/assets/custom/light_logo-ypcanada.png?1573842435",
      "currentThemeColor": "#0c45a4",
      "customWelcomeMessage": "<p style=\"font-size: 36px; font-weight: bold;\">Welcome!</p>",
      "customerInstanceURL": null,
      "darkLogoUrl": "https://mymetrics.yp.ca/app/assets/custom/dark_logo-ypcanada.png?1571362316",
      "defaultLocale": "en_US",
      "defaultNavFavorites": false,
      "deployBadge": "",
      "disableInactiveProductsFiltering": false,
      "disableUpdateDashboardButton": false,
      "ez_login_link_expiration_in_hours": "72",
      "faviconUrl": null,
      "featurePackageName": "SmartSuite Package",
      "feedbackActive": true,
      "firstName": "{redacted}",
      "googleLoginUrl": "https://im.tapclicks.com/oauthredirector.php?endpoint=https%3A%2F%2Faccounts.google.com%2Fo%2Foauth2%2Fv2%2Fauth%3Fscope%3Dhttps%253A%252F%252Fwww.googleapis.com%252Fauth%252Fuserinfo.profile%2Bhttps%253A%252F%252Fwww.googleapis.com%252Fauth%252Fuserinfo.email%26redirect_uri%3Dhttps%253A%252F%252Fim.tapclicks.com%252Foauthredirector.php%26response_type%3Dcode%26client_id%3D994750371900-uljdn20laj671ni2laj28cqmnjp26ouo.apps.googleusercontent.com%26access_type%3Donline%26state%3Dd3393bb027e03da6120d0c4b8f643c9b&callback=https%3A%2F%2Fmymetrics.yp.ca%3Fredirect_from_google%3D1%26use_nui%3D1",
      "guides": [],
      "hasAccessToAudience2": false,
      "hasClientRecordGlobalFilters": false,
      "hasCustomTranslations": true,
      "hasDevTools": false,
      "hasTapReportsFreemiumPlatformSourceLimitation": false,
      "hideGuide": false,
      "hideInactiveServicesLeftNav": true,
      "hideSuperAdminSupportLink": false,
      "homePage": "92",
      "impersonatorUser": null,
      "instanceStatus": "active",
      "instanceTimezone": "America/New_York",
      "instanceTimezoneDisplay": "Eastern Standard Time (America/New_York)",
      "instanceURL": "{redacted}",
      "invoiceHandling": "chargebee",
      "ioRoleName": null,
      "ioRolePermissions": null,
      "isAdfloNativeReportingEnabled": false,
      "isAdtaxiInstance": false,
      "isAnalyticsRoute": false,
      "isAutopilotOnboardingFlow": false,
      "isClassicAngularAllowed": false,
      "isClustersSupportEnabled": true,
      "isCurrentUserPredefinedSuperAdmin": false,
      "isDashboardGenerated": true,
      "isDcpSwitch": false,
      "isDevelopmentServer": false,
      "isExternalDestinationEnabled": true,
      "isFrameMode": false,
      "isFreeTrial": false,
      "isGoalsForAgentsEnabled": false,
      "isGoogleLoginEnabled": false,
      "isHipaaInstance": false,
      "isIOAuthorized": false,
      "isIOHomePage": false,
      "isIORoute": false,
      "isImpersonationMode": false,
      "isLocalInstance": false,
      "isLoggedIn": true,
      "isMarketplaceCentralizedInstance": false,
      "isOldUiDisabled": true,
      "isOnSupBilling": false,
      "isOnSupBillingCustomPlan": false,
      "isOnboarding": false,
      "isOnboardingCompleted": false,
      "isProductionServer": true,
      "isRemoteLogin": false,
      "isRevLocalInstance": false,
      "isRunningDbUpdate": false,
      "isSelfRegistrationEnable": false,
      "isSmartCampaignFilteringEnabled": true,
      "isStagingServer": false,
      "isTestdriveInstance": false,
      "is_order_management_mode_enabled": false,
      "landingPageState": "92",
      "lastName": "{redacted}",
      "lightLogoUrl": "https://mymetrics.yp.ca/app/assets/custom/light_logo-ypcanada.png?1573842435",
      "locale": "en",
      "localesSupported": {
        "en_US": {
          "label": "English",
          "plurals": 2
        },
        "es_ES": {
          "label": "Spanish",
          "plurals": 2
        },
        "fr_CA": {
          "label": "French (Canada)",
          "plurals": 2
        },
        "hi_IN": {
          "label": "Hindi",
          "plurals": 2
        },
        "id_ID": {
          "label": "Indonesian",
          "plurals": 1
        }
      },
      "minimumPasswordLength": 8,
      "neverExpiringPermalinksEnabled": false,
      "nuiLoginPageMessage": "Let the data visualization begin",
      "onboardingStep": 3,
      "overrideLoginPageFooterText": false,
      "passwordRequirements": "{redacted}",
      "platformSource": "",
      "preferredOnboardingFlow": "autopilot",
      "primaryThemeColor": "#0b2b65",
      "product_images_in_catalogue": true,
      "pubSubDetails": {
        "pubsub_api_key": "{redacted}",
        "pubsub_auth_endpoint": "{redacted}",
        "pubsub_cluster": "us3",
        "pubsub_instance_channel": "{redacted}",
        "pubsub_presence_report_studio_prefix": "{redacted}",
        "pubsub_user_channel": "{redacted}"
      },
      "reportLanguage": "en_US",
      "reportStudioShortcutsEnabled": true,
      "reportingProfileId": "1",
      "reportingProfileName": "Default Profile",
      "resellerBilling": false,
      "resellerName": "",
      "role": {
        "can_impersonate_other_agents": true,
        "can_manage_alerts": false,
        "cluster_id": null,
        "cluster_name": null,
        "id": "1",
        "is_default": false,
        "is_selectable": true,
        "manage_dashboards": false,
        "manage_report_studio": false,
        "name": "Classic TapClicks - Default Role",
        "predefined_role_key": "{redacted}",
        "predefined_role_key_display": "{redacted}",
        "reporting_profile_ids": null,
        "reporting_profile_permission": "only_assigned",
        "reporting_profile_permission_display": "Only the user's assigned data profile",
        "reporting_template_ids": [
          "1"
        ],
        "role_association": "agent",
        "role_association_display": "Agent",
        "role_permissions": {
          "aiagent": {
            "can_read_write": "none"
          },
          "aiagentcalculation": {
            "can_read_write": "none"
          },
          "aiagentdashboard": {
            "can_read_write": "none"
          },
          "aiagentreportstudio": {
            "can_read_write": "none"
          },
          "alert": {
            "can_read_write": "none"
          },
          "anomaly": {
            "can_read_write": "all"
          },
          "app": {
            "can_access_acorn": true,
            "can_access_gds": false,
            "can_access_ripley": true,
            "can_access_sheets": false,
            "can_access_tech_support_chatbot": false,
            "can_access_zest": false,
            "can_impersonate_other_agents": false,
            "can_read_write": "all",
            "enable_adflo_proposal": true,
            "enable_order_management": true
          },
          "audience": {
            "can_read_write": "all"
          },
          "auditlog": {
            "can_read_write": "none"
          },
          "billable": {
            "can_read_write": "none"
          },
          "billing": {
            "can_read_write": "none"
          },
          "billingconfig": {
            "can_read_write": "none"
          },
          "calculation": {
            "can_read_write": "none"
          },
          "campaign": {
            "can_read_write": "none"
          },
          "cancellationreason": {
            "can_read_write": "none"
          },
          "cataloguesetting": {
            "can_read_write": "all",
            "can_read_write_catalogue_settings": "none"
          },
          "category": {
            "can_read_write": "none"
          },
          "client": {
            "can_read_write": "none"
          },
          "clientcalculations": {
            "can_read_write": "none"
          },
          "clientcategory": {
            "can_read_write": "all"
          },
          "clientgroup": {
            "can_read_write": "none"
          },
          "cluster": {
            "can_read_write": "none"
          },
          "clusteraccess": {
            "can_read_write": "none"
          },
          "clustermember": {
            "can_read_write": "none"
          },
          "columnpreferences": {
            "can_read_write": "none"
          },
          "comment": {
            "can_read_write": "none"
          },
          "competitorresearch": {
            "can_read_write": "all"
          },
          "connectionstatus": {
            "can_read_write": "none"
          },
          "contentset": {
            "can_read_write": "none"
          },
          "creative": {
            "can_read_write": "none",
            "can_read_write_creative_tag": "all"
          },
          "custombenchmark": {
            "can_read_write": "none"
          },
          "customtranslation": {
            "can_read_write": "none"
          },
          "dashboard": {
            "can_edit_draw_options": false,
            "can_edit_favorites": true,
            "can_edit_reporting_options": false,
            "can_publish_to_library": false,
            "can_read_write": "read_only",
            "limit_dashboard_access_with_data_profile": false,
            "manage_access_lists": false
          },
          "dashboardchatgptsummaries": {
            "can_read_write": "none"
          },
          "dashboardexecutivesummaries": {
            "can_read_write": "all"
          },
          "dashfolders": {
            "can_read_write": "read_only"
          },
          "dataexporter": {
            "can_read_write": "none"
          },
          "dataloadstatus": {
            "can_read_write": "none"
          },
          "entityform": {
            "can_read_write": "none"
          },
          "export": {
            "can_read_write": "none"
          },
          "flight": {
            "can_read_write": "all",
            "can_read_write_flight_cancel": "none"
          },
          "goals": {
            "can_read_write": "none"
          },
          "hintreports": {
            "can_read_write": "none"
          },
          "importwizard": {
            "can_read_write": "none",
            "can_read_write_manual_upload": "none"
          },
          "industrybenchmark": {
            "can_read_write": "none"
          },
          "insightshq": {
            "can_read_write": "none"
          },
          "ioexport": {
            "can_read_write": "all"
          },
          "layout": {
            "can_edit_draw_options": false,
            "can_read_write": "read_only"
          },
          "lead": {
            "can_read_write": "read_only"
          },
          "leaddetails": {
            "can_read_write": "all"
          },
          "leadnotes": {
            "can_read_write": "all"
          },
          "leadnotification": {
            "can_read_write": "read_only"
          },
          "lineitem": {
            "can_read_write": "none",
            "can_read_write_line_item_cancel": "none"
          },
          "marginrule": {
            "can_read_write": "none"
          },
          "mobileapp": {
            "can_read_write": "read_only"
          },
          "namingconvention": {
            "can_read_write": "none"
          },
          "note": {
            "can_read_write": "all"
          },
          "oauth": {
            "can_read_write": "{redacted}"
          },
          "oauthclusteraccess": {
            "can_read_write": "{redacted}"
          },
          "objective": {
            "can_read_write": "none"
          },
          "order": {
            "can_read_write": "all",
            "can_read_write_order_cancel": "none"
          },
          "preference": {
            "can_read_write": "none"
          },
          "product": {
            "can_read_write": "none"
          },
          "proposal": {
            "can_approve_reject_proposal": true,
            "can_client_analysis": "none",
            "can_proposal_ai_recommendation": true,
            "can_read_write": "none",
            "can_read_write_proposal_creation": true,
            "can_read_write_proposal_line_item": "read_only"
          },
          "proposalexport": {
            "can_read_write": "all"
          },
          "pushconnector": {
            "can_datafusion": false,
            "can_dfp": false,
            "can_facebook_ads": false,
            "can_google_ads": false,
            "can_linkedin_ads": false
          },
          "queue": {
            "can_read_write": "none"
          },
          "quickreport": {
            "can_read_write": "all"
          },
          "relationship": {
            "can_read_write": "read_only"
          },
          "reportingprofile": {
            "can_read_write": "none"
          },
          "reportingtemplate": {
            "can_read_write": "read_only"
          },
          "reportstudio": {
            "can_edit_favorites": true,
            "can_publish_to_library": false,
            "can_read_write": "all",
            "limit_report_studio_access_with_data_profile": false,
            "manage_access_lists": false
          },
          "reportstudiochatgptsummaries": {
            "can_read_write": "none"
          },
          "reportstudioexecutivesummaries": {
            "can_read_write": "all"
          },
          "role": {
            "can_access_roles": "at_and_below",
            "can_read_write": "none"
          },
          "sales_config": {
            "can_read_write": "none"
          },
          "sales_health": {
            "can_read_write": "read_only"
          },
          "scheduledreport": {
            "can_read_write": "all"
          },
          "serp": {
            "can_read_write": "all"
          },
          "service": {
            "can_read_write": "none"
          },
          "serviceclientmapping": {
            "can_read_write": "none"
          },
          "servicelookup": {
            "can_read_write": "none"
          },
          "servicesettings": {
            "can_read_write": "none"
          },
          "siteauditor": {
            "can_read_write": "all"
          },
          "smartcampaign": {
            "can_read_write": "none"
          },
          "statuspage": {
            "can_read_write": "none"
          },
          "stellarsetting": {
            "can_read_write": "none"
          },
          "tag": {
            "can_read_write": "all"
          },
          "tapoptimize": {
            "can_read_write": "none"
          },
          "task": {
            "can_read_write": "none",
            "can_read_write_workflow_task_due_date": "all"
          },
          "tasktag": {
            "can_read_write": "none",
            "can_read_write_task_tag_assignment_access": "none"
          },
          "tasktagconfig": {
            "can_read_write": "none"
          },
          "tasktime": {
            "can_read_write": "none"
          },
          "udb": {
            "can_read_write": "none"
          },
          "user": {
            "can_create_modify_users": "below",
            "can_impersonate_users": "below",
            "can_read_write": "none"
          },
          "userimage": {
            "can_read_write": "all"
          },
          "webhooks": {
            "can_read_write": "none"
          },
          "website": {
            "can_read_write": "all"
          },
          "widget": {
            "can_edit_draw_options": false,
            "can_edit_widget_alerts": false,
            "can_edit_widget_annotations": false,
            "can_read_write": "read_only",
            "can_read_write_filter_set": "none"
          },
          "workflowaction": {
            "can_read_write": "none"
          },
          "workflowwebhookdestinations": {
            "can_read_write": "none"
          },
          "workflowwebhookinbound": {
            "can_read_write": "none"
          }
        },
        "role_type": "analytics",
        "role_type_display": "Analytics",
        "scheduled_report_permission": "edit",
        "scheduled_report_permission_display": "Create, View and Edit (Clients from assigned Client Group only)",
        "user_type": "agent",
        "user_type_display": "Agent"
      },
      "secondaryThemeColor": "#f9df9c",
      "sheetsSelfServePlanId": "",
      "shouldHideTapClicksBranding": true,
      "showCategoriesOverview": false,
      "showComparisonArrows": true,
      "showDataFreshnessDate": false,
      "showDefaultComparisonArrowColor": true,
      "showDrilldownsWhenOverviewDisabled": false,
      "showOnboardingMenu": false,
      "showPredefinedCategoryDashboards": "no",
      "showScheduledReports": true,
      "showScores": false,
      "showServiceDrilldowns": false,
      "showServicesOverview": false,
      "smartCampaignsEnabled": true,
      "statusMessage": null,
      "supportEmail": "{redacted}",
      "tapCoreStack": "prod-simple",
      "theme": "bright",
      "themeType": "light",
      "type": "agent",
      "typeDisplayName": "Agent",
      "usageLimits": {
        "smartslides": {
          "billable_product_code": "{redacted}",
          "feature_code": "{redacted}",
          "feature_name": "SmartSlides",
          "types": {
            "smartslides_generations": {
              "custom_allocation_quantity": 0,
              "cycle_additions_quantity": 0,
              "default_plan": {
                "ceiling_quantity": 10000,
                "code": "{redacted}",
                "effective_default_quantity": 10000,
                "floor_quantity": 2,
                "is_dynamic": true,
                "name": "SmartSlides for SmartSuite"
              },
              "is_enabled": true,
              "total_effective_limit": 10000,
              "type_code": "{redacted}",
              "type_name": "Generations"
            }
          }
        }
      },
      "useRecaptcha": false,
      "use_places_api_for_company_name": true,
      "user": {
        "additional_details_1": "",
        "additional_details_2": "",
        "additional_details_3": "",
        "address_1": "",
        "address_2": "",
        "can_access_new_report_studio": false,
        "can_access_nui": true,
        "city": "",
        "client_group_id": "24361",
        "client_group_name": "Roof Doctor - 250-765-3013 - 99991001094399",
        "client_id": null,
        "client_name": null,
        "client_reporting_status": null,
        "cluster_id": "1",
        "cluster_is_cluster_group": false,
        "cluster_name": "YP Canada",
        "company_name": "Everett Knight",
        "country": "",
        "country_display": "",
        "created_by_user": "{redacted}",
        "created_by_user_id": "14",
        "creation_time": 1740481559,
        "default_home_page": null,
        "default_home_page_display": null,
        "display_id": "20431",
        "display_name": "{redacted}",
        "email": "{redacted}",
        "enable_gds_module": false,
        "enable_io_tool_module": false,
        "enable_lead_management_module": false,
        "enable_planner_module": false,
        "enable_sheets_module": false,
        "enable_stellar_module": false,
        "enable_tap_gpt_module": false,
        "external_user_id": null,
        "first_login": 1750249767,
        "first_name": "{redacted}",
        "formatted_creation_time": "Feb 25, 2025 6:05 AM",
        "formatted_first_login": "Jun 18, 2025 8:29 AM",
        "formatted_last_login_timestamp": "Nov 04, 2026 4:48 PM",
        "granular_permissions_by_entity": [],
        "has_dark_logo": false,
        "has_light_logo": false,
        "hipaa_acknowledgement_timestamp": null,
        "id": "20431",
        "io_tool_extended_absence": false,
        "io_tool_notification_frequency": null,
        "io_tool_notification_own_activity": false,
        "io_tool_queue_ids": null,
        "io_tool_role_id": null,
        "io_tool_role_is_accessible": false,
        "io_tool_role_name": null,
        "io_tool_use_in_out_status": false,
        "last_login_timestamp": 1793828912,
        "last_name": "{redacted}",
        "lead_notification_frequency": "real_time",
        "lead_notification_frequency_display": "Real Time",
        "login_count": "11",
        "nui_feedback": null,
        "override_dashboard_page_ids": null,
        "override_dashboard_pages_from_reporting_profile": false,
        "phone": "{redacted}",
        "planner_id": null,
        "report_language": "en_US",
        "report_language_display": "English",
        "reporting_profile_id": "1",
        "reporting_profile_name": "Default Profile",
        "role_id": "1",
        "role_is_accessible": true,
        "role_name": "Classic TapClicks - Default Role",
        "role_predefined_role_key": "{redacted}",
        "show_categories_overview": "no",
        "show_categories_overview_display": "no",
        "show_services_overview": "no",
        "show_services_overview_display": "no",
        "show_welcome_modal": false,
        "state": "",
        "status": "active",
        "status_display": "Active",
        "timezone": "default",
        "timezone_display": "Use platform default (currently: America/New_York)",
        "two_step_verification_enabled": false,
        "use_nui": true,
        "use_sup_goals": true,
        "user_image_id": null,
        "user_image_metadata": null,
        "user_type": "agent",
        "user_type_display": "Agent",
        "zip": ""
      },
      "userDisplayName": "Everett",
      "userEmail": "{redacted}",
      "userId": "20431",
      "userImageId": null,
      "userImageMetadata": null,
      "weekStartsOnMonday": false,
      "whitelabelClusterId": null,
      "whitelabelClusterIdsByServerName": []
    }
  },
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (48)

- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 1x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 2x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 2x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 2x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 1x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 2x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 2x)
- `cookie SimpleSAMLAuthToken` comes from `POST /simplesaml/module.php/saml/sp/saml2-acs.php/mymetrics_yp_ca_activedirectory_ypcanada` `set-cookie SimpleSAMLAuthToken` (seen 2x)
- `cookie adminhtml` comes from `GET /saml/activedirectory_ypcanada.php` `set-cookie adminhtml` (seen 1x)
- `cookie ajs_user_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.userEmail` (seen 1x)
- `cookie ajs_group_id` comes from `GET /server/api/session/initUser` `response.body $.data.settings.instanceURL` (seen 1x)
- `cookie adminhtml` comes from `POST /server/api/log_performance` `set-cookie adminhtml` (seen 1x)
- `response.body $.data.settings.userEmail` feeds `GET /server/api/branding/mappings` `cookie ajs_user_id`
- `response.body $.data.settings.instanceURL` feeds `GET /server/api/branding/mappings` `cookie ajs_group_id`
- `response.body $.data.settings.userEmail` feeds `GET /server/api/categories` `cookie ajs_user_id`
- `response.body $.data.settings.instanceURL` feeds `GET /server/api/categories` `cookie ajs_group_id`
- `response.body $.data.settings.userEmail` feeds `GET /server/api/categories/{categoryId}/data/{dataId}` `cookie ajs_user_id`
- `response.body $.data.settings.instanceURL` feeds `GET /server/api/categories/{categoryId}/data/{dataId}` `cookie ajs_group_id`
- `response.body $.data.settings.userEmail` feeds `GET /server/api/dash/dashboardfilters` `cookie ajs_user_id`
- `response.body $.data.settings.instanceURL` feeds `GET /server/api/dash/dashboardfilters` `cookie ajs_group_id`
- and 28 more

**Observed in** (2)

- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:33.050Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.663:0`
- YP Metrics tour, step `open-metrics`, run `20261104T214824Z-f674`, 2026-11-04T21:48:33.492Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.697:0`

### `GET /server/api/tags`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `all` | query | literal | `true` | no |
| `datatable` | query | literal | `true` | yes |
| `summary` | query | literal | `true` | yes |
| `page` | query | literal | `0,50` | yes |
| `query_id` | query | computed | `9982b0da-502d-4708-b43d-691728da6f2b` | yes |
| `metadata` | query | literal | `true` | no |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "anyOf": [
        {
          "properties": {
            "aaData": {
              "items": {
                "properties": {
                  "associated_tag_values": {
                    "type": "null"
                  },
                  "can_be_accessed": {
                    "type": "boolean"
                  },
                  "can_be_copied": {
                    "type": "boolean"
                  },
                  "can_be_deleted": {
                    "type": "boolean"
                  },
                  "can_be_deleted_tooltip": {
                    "type": "null"
                  },
                  "can_be_edited": {
                    "type": "boolean"
                  },
                  "color": {
                    "type": "string"
                  },
                  "id": {
                    "type": "string"
                  },
                  "tag": {
                    "type": "string"
                  }
                },
                "required": [
                  "id",
                  "tag",
                  "color",
                  "associated_tag_values",
                  "can_be_accessed",
                  "can_be_edited",
                  "can_be_deleted",
                  "can_be_copied",
                  "can_be_deleted_tooltip"
                ],
                "type": "object"
              },
              "type": "array"
            },
            "iTotalDisplayRecords": {
              "type": "integer"
            },
            "iTotalRecords": {
              "type": "integer"
            },
            "sEcho": {
              "type": "string"
            }
          },
          "required": [
            "sEcho",
            "iTotalRecords",
            "iTotalDisplayRecords",
            "aaData"
          ],
          "type": "object"
        },
        {
          "type": "array"
        }
      ]
    },
    "error": {
      "type": "boolean"
    },
    "metadata": {
      "properties": {
        "columns": {
          "items": {
            "properties": {
              "allows_null_value": {
                "type": "boolean"
              },
              "audit_name_column": {
                "type": "null"
              },
              "cell_class": {
                "type": "null"
              },
              "concat_columns_split": {
                "type": "string"
              },
              "custom_sort": {
                "type": "null"
              },
              "data_exporter": {
                "type": "boolean"
              },
              "default_sort": {
                "type": "null"
              },
              "details_order": {
                "type": "integer"
              },
              "edit_detail_group_id": {
                "type": "null"
              },
              "enable_history": {
                "type": "boolean"
              },
              "field": {
                "type": "string"
              },
              "filter_input_type": {
                "type": "null"
              },
              "foreign_mapping": {
                "properties": {
                  "clause_conditions": {
                    "items": {
                      "properties": {
                        "clause_operator": {
                          "type": "string"
                        },
                        "condition_operator": {
                          "type": "string"
                        },
                        "foreign_field": {
                          "type": "string"
                        },
                        "source_field": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "source_field",
                        "foreign_field",
                        "condition_operator",
                        "clause_operator"
                      ],
                      "type": "object"
                    },
                    "type": "array"
                  },
                  "default_null_display_value": {
                    "type": "null"
                  },
                  "foreign_dependencies": {
                    "type": "array"
                  },
                  "foreign_entity_field": {
                    "type": "null"
                  },
                  "foreign_entity_route": {
                    "type": "string"
                  },
                  "foreign_expression_fields": {
                    "properties": {
                      "associated_tag_values": {
                        "type": "string"
                      }
                    },
                    "required": [
                      "associated_tag_values"
                    ],
                    "type": "object"
                  },
                  "foreign_fields": {
                    "properties": {
                      "associated_tag_values": {
                        "type": "string"
                      }
                    },
                    "required": [
                      "associated_tag_values"
                    ],
                    "type": "object"
                  },
                  "foreign_is_service_data_table": {
                    "type": "boolean"
                  },
                  "foreign_table_alias": {
                    "type": "null"
                  },
                  "foreign_table_name": {
                    "type": "string"
                  },
                  "foreign_values_route": {
                    "type": "string"
                  },
                  "has_object_mapping": {
                    "type": "boolean"
                  },
                  "intermediary_mappings": {
                    "type": "array"
                  },
                  "is_expression_mapping": {
                    "type": "boolean"
                  },
                  "is_forceful_mapping": {
                    "type": "null"
                  },
                  "is_intermediary_join": {
                    "type": "boolean"
                  },
                  "join_type": {
                    "type": "string"
                  },
                  "object_mapping_fields": {
                    "type": "null"
                  },
                  "object_mapping_key": {
                    "type": "null"
                  },
                  "param_bindings": {
                    "type": "null"
                  },
                  "query_type": {
                    "type": "string"
                  },
                  "source_join_table_name": {
                    "type": "string"
                  },
                  "sub_query_fields": {
                    "type": "null"
                  }
                },
                "required": [
                  "foreign_table_name",
                  "foreign_fields",
                  "foreign_expression_fields",
                  "foreign_table_alias",
                  "foreign_entity_route",
                  "foreign_values_route",
                  "source_join_table_name",
                  "default_null_display_value",
                  "join_type",
                  "clause_conditions",
                  "is_intermediary_join",
                  "is_forceful_mapping",
                  "is_expression_mapping",
                  "has_object_mapping",
                  "intermediary_mappings",
                  "query_type",
                  "object_mapping_key",
                  "object_mapping_fields",
                  "foreign_entity_field",
                  "foreign_is_service_data_table",
                  "param_bindings",
                  "foreign_dependencies",
                  "sub_query_fields"
                ],
                "type": [
                  "object",
                  "null"
                ]
              },
              "foreign_mapping_dependencies": {
                "type": "array"
              },
              "format": {
                "type": "string"
              },
              "has_set_values": {
                "type": "boolean"
              },
              "is_audit_metadata_column": {
                "type": "boolean"
              },
              "is_custom_cell_render": {
                "type": "boolean"
              },
              "is_exportable": {
                "type": "boolean"
              },
              "is_filterable": {
                "type": "boolean"
              },
              "is_foreign_audit_enabled": {
                "type": "boolean"
              },
              "is_foreign_field": {
                "type": "boolean"
              },
              "is_foreign_key": {
                "type": "boolean"
              },
              "is_groupable": {
                "type": "boolean"
              },
              "is_groupby_name_field": {
                "type": "boolean"
              },
              "is_hidden": {
                "type": "boolean"
              },
              "is_metric": {
                "type": "boolean"
              },
              "is_most_recent_value": {
                "type": "boolean"
              },
              "is_primary_key": {
                "type": "boolean"
              },
              "is_primary_name_field": {
                "type": "boolean"
              },
              "is_pseudo": {
                "type": "boolean"
              },
              "is_read_only": {
                "type": "boolean"
              },
              "is_required_in_datatable": {
                "type": "boolean"
              },
              "is_sortable": {
                "type": "boolean"
              },
              "is_taggable": {
                "type": "boolean"
              },
              "label": {
                "type": "string"
              },
              "original_date_format": {
                "type": "null"
              },
              "postprocess_type": {
                "type": "string"
              },
              "precision": {
                "type": "null"
              },
              "sticky": {
                "type": "boolean"
              },
              "summary_dependencies": {
                "type": "array"
              },
              "summary_order": {
                "type": "integer"
              },
              "tooltip": {
                "type": "null"
              },
              "values": {
                "type": "array"
              },
              "width": {
                "type": "null"
              }
            },
            "required": [
              "field",
              "label",
              "format",
              "values",
              "has_set_values",
              "details_order",
              "summary_order",
              "is_sortable",
              "cell_class",
              "width",
              "custom_sort",
              "default_sort",
              "tooltip",
              "postprocess_type",
              "is_read_only",
              "allows_null_value",
              "is_hidden",
              "is_primary_key",
              "is_primary_name_field",
              "original_date_format",
              "is_foreign_key",
              "is_foreign_field",
              "foreign_mapping",
              "foreign_mapping_dependencies",
              "concat_columns_split",
              "is_pseudo",
              "is_custom_cell_render",
              "is_groupable",
              "is_filterable",
              "sticky",
              "filter_input_type",
              "is_groupby_name_field",
              "is_most_recent_value",
              "is_metric",
              "precision",
              "enable_history",
              "is_taggable",
              "summary_dependencies",
              "edit_detail_group_id",
              "is_exportable",
              "is_required_in_datatable",
              "is_foreign_audit_enabled",
              "audit_name_column",
              "is_audit_metadata_column",
              "data_exporter"
            ],
            "type": "object"
          },
          "type": "array"
        }
      },
      "required": [
        "columns"
      ],
      "type": "object"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": {
    "aaData": [
      {
        "associated_tag_values": null,
        "can_be_accessed": true,
        "can_be_copied": true,
        "can_be_deleted": true,
        "can_be_deleted_tooltip": null,
        "can_be_edited": true,
        "color": "#436E54",
        "id": "1",
        "tag": "Client #1 WANDER CONSTRUCTION ARRIVER JEUDI  LE 3 SEPTEMBRE LTD"
      },
      {
        "associated_tag_values": null,
        "can_be_accessed": true,
        "can_be_copied": true,
        "can_be_deleted": true,
        "can_be_deleted_tooltip": null,
        "can_be_edited": true,
        "color": "#6B59A7",
        "id": "2",
        "tag": "HÔTESSE"
      }
    ],
    "iTotalDisplayRecords": 4,
    "iTotalRecords": 4,
    "sEcho": "prod"
  },
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (11)

- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 2x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 2x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 2x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 2x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 2x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 2x)
- `cookie adminhtml` comes from `storage` `storage cookie[adminhtml]` (seen 1x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 2x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 2x)
- `cookie adminhtml` comes from `GET /server/api/tags` `set-cookie adminhtml` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/tags` `cookie adminhtml`

**Observed in** (2)

- YP Metrics tour, step `open-tags`, run `20261104T214824Z-f674`, 2026-11-04T21:52:43.341Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.987:0`
- YP Metrics tour, step `open-tags`, run `20261104T214824Z-f674`, 2026-11-04T21:52:43.341Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.988:0`

### `GET /server/api/users/{userId}/listsettings`

Host: `mymetrics.yp.ca`

Auth: cookie `SimpleSAMLAuthToken`, cookie `__stripe_mid`, cookie `__stripe_sid`, cookie `adminhtml`, cookie `fs_lua`, cookie `fs_uid`

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `userId` | path | binding | `20431` | yes |
| `query_id` | query | computed | `07fe8860-3cab-4ca5-a9eb-956b79b17689` | yes |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "type": "array"
    },
    "error": {
      "type": "boolean"
    },
    "status": {
      "type": "integer"
    },
    "warnings": {
      "type": "array"
    }
  },
  "required": [
    "data",
    "error",
    "warnings",
    "status"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": [],
  "error": false,
  "status": 200,
  "warnings": []
}
```

**Bindings** (13)

- `path userId` comes from `GET /server/api/session/initUser` `response.body $.data.settings.userId` (seen 2x)
- `cookie ajs_user_id` comes from `storage` `storage cookie[ajs_user_id]` (seen 2x)
- `cookie ajs_anonymous_id` comes from `storage` `storage cookie[ajs_anonymous_id]` (seen 2x)
- `cookie __stripe_sid` comes from `storage` `storage cookie[__stripe_sid]` (seen 2x)
- `cookie __stripe_mid` comes from `storage` `storage cookie[__stripe_mid]` (seen 2x)
- `cookie ajs_group_id` comes from `storage` `storage cookie[ajs_group_id]` (seen 2x)
- `cookie SimpleSAMLAuthToken` comes from `storage` `storage cookie[SimpleSAMLAuthToken]` (seen 2x)
- `cookie adminhtml` comes from `GET /server/api/dashfolders/isfoldersavailable` `set-cookie adminhtml` (seen 1x)
- `cookie fs_lua` comes from `storage` `storage cookie[fs_lua]` (seen 2x)
- `cookie fs_uid` comes from `storage` `storage cookie[fs_uid]` (seen 2x)
- `cookie adminhtml` comes from `storage` `storage cookie[adminhtml]` (seen 1x)
- `set-cookie adminhtml` feeds `GET /server/api/dashfolders` `cookie adminhtml`
- `set-cookie adminhtml` feeds `GET /server/api/reportstudio` `cookie adminhtml`

**Observed in** (2)

- YP Metrics tour, step `open-dashboards`, run `20261104T214824Z-f674`, 2026-11-04T21:49:07.779Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.823:0`
- YP Metrics tour, step `open-reportstudio`, run `20261104T214824Z-f674`, 2026-11-04T21:50:12.477Z, exchange `98DEBBD1EE1FA8EFB33A3470299B3426:339768.911:0`

### `GET /bc/v1/app-services/account/{accountId}/bank-hours`

Host: `ypapi.ypcloud.io` (CORS)

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `accountId` | path | binding | `99991001094399` | yes |
| `bankHoursByMid` | query | literal | `false` | yes |

| Header | Value | Required |
| --- | --- | --- |
| `authorization` | redacted | yes |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "properties": {
        "remainingHours": {
          "type": "integer"
        }
      },
      "required": [
        "remainingHours"
      ],
      "type": "object"
    },
    "result": {
      "type": "boolean"
    }
  },
  "required": [
    "result",
    "data"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": {
    "remainingHours": 4
  },
  "result": true
}
```

**Bindings** (2)

- `path accountId` comes from `GET /bc/v1/app-services/account` `response.body $.data.accounts[0].accountNumber` (seen 7x)
- `header authorization` comes from `POST /bc/v1/app-services/authenticate` `response.body $.data.securityToken` (seen 7x)

**Observed in** (7)

- Read-only tour, step `open-start`, run `20261104T213727Z-251f`, 2026-11-04T21:37:30.940Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2194:0`
- Read-only tour, step `open-3`, run `20261104T213727Z-251f`, 2026-11-04T21:37:39.669Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2390:0`
- Read-only tour, step `open-start`, run `20261104T213945Z-3040`, 2026-11-04T21:39:48.197Z, exchange `51C197BF8E6E7F516F839DCE3A6FCF4E:339524.3147:0`
- Read-only tour, step `open-3`, run `20261104T213945Z-3040`, 2026-11-04T21:39:57.257Z, exchange `51C197BF8E6E7F516F839DCE3A6FCF4E:339524.3343:0`
- Read-only tour, step `open-11`, run `20261104T213945Z-3040`, 2026-11-04T21:40:30.111Z, exchange `51C197BF8E6E7F516F839DCE3A6FCF4E:339524.4099:0`
- Read-only tour, step `open-11`, run `20261104T213945Z-3040`, 2026-11-04T21:40:30.417Z, exchange `51C197BF8E6E7F516F839DCE3A6FCF4E:339524.4112:0`
- YP Metrics tour, step `open-portal`, run `20261104T214824Z-f674`, 2026-11-04T21:48:27.773Z, exchange `6529301EEA3C0CAD3EE709F53337745E:339524.4518:0`

### `GET /bc/v1/app-services/merchant/{merchantId}/assets`

Host: `ypapi.ypcloud.io` (CORS)

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `merchantId` | path | binding | `4302054` | yes |
| `status` | query | literal | `ACTIVE` | yes |

| Header | Value | Required |
| --- | --- | --- |
| `authorization` | redacted | yes |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "properties": {
        "assets": {
          "items": {
            "properties": {
              "effectiveDate": {
                "format": "date-time",
                "type": "string"
              },
              "expirationDate": {
                "format": "date-time",
                "type": "string"
              },
              "udac": {
                "type": "string"
              }
            },
            "required": [
              "udac",
              "effectiveDate",
              "expirationDate"
            ],
            "type": "object"
          },
          "type": "array"
        }
      },
      "required": [
        "assets"
      ],
      "type": "object"
    },
    "result": {
      "type": "boolean"
    }
  },
  "required": [
    "result",
    "data"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": {
    "assets": [
      {
        "effectiveDate": "2026-03-01T00:00:00Z",
        "expirationDate": "2027-03-01T23:59:59Z",
        "udac": "BL"
      },
      {
        "effectiveDate": "2026-04-30T00:00:00Z",
        "expirationDate": "2027-04-29T23:59:59Z",
        "udac": "SEM"
      }
    ]
  },
  "result": true
}
```

**Bindings** (3)

- `path merchantId` comes from `GET /bc/v1/app-services/account` `response.body $.data.accounts[0].merchants[0].merchantId` (seen 11x)
- `header authorization` comes from `POST /bc/v1/app-services/authenticate` `response.body $.data.securityToken` (seen 22x)
- `path merchantId` comes from `GET /bc/v1/app-services/account` `response.body $.data.accounts[0].merchants[1].merchantId` (seen 11x)

**Observed in** (22)

- Read-only tour, step `open-start`, run `20261104T213727Z-251f`, 2026-11-04T21:37:30.938Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2192:0`
- Read-only tour, step `open-start`, run `20261104T213727Z-251f`, 2026-11-04T21:37:30.939Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2193:0`
- Read-only tour, step `open-start`, run `20261104T213727Z-251f`, 2026-11-04T21:37:30.958Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2203:0`
- Read-only tour, step `open-start`, run `20261104T213727Z-251f`, 2026-11-04T21:37:30.959Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2204:0`
- Read-only tour, step `open-3`, run `20261104T213727Z-251f`, 2026-11-04T21:37:39.668Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2388:0`
- Read-only tour, step `open-3`, run `20261104T213727Z-251f`, 2026-11-04T21:37:39.668Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2389:0`
- Read-only tour, step `open-3`, run `20261104T213727Z-251f`, 2026-11-04T21:37:39.684Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2399:0`
- Read-only tour, step `open-3`, run `20261104T213727Z-251f`, 2026-11-04T21:37:39.685Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2400:0`
- Read-only tour, step `open-start`, run `20261104T213945Z-3040`, 2026-11-04T21:39:48.196Z, exchange `51C197BF8E6E7F516F839DCE3A6FCF4E:339524.3145:0`
- Read-only tour, step `open-start`, run `20261104T213945Z-3040`, 2026-11-04T21:39:48.196Z, exchange `51C197BF8E6E7F516F839DCE3A6FCF4E:339524.3146:0`
- Read-only tour, step `open-start`, run `20261104T213945Z-3040`, 2026-11-04T21:39:48.211Z, exchange `51C197BF8E6E7F516F839DCE3A6FCF4E:339524.3156:0`
- Read-only tour, step `open-start`, run `20261104T213945Z-3040`, 2026-11-04T21:39:48.212Z, exchange `51C197BF8E6E7F516F839DCE3A6FCF4E:339524.3157:0`
- and 10 more

### `GET /bc/v1/app-services/url/analytics/{analyticId}`

Host: `ypapi.ypcloud.io` (CORS)

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `analyticId` | path | binding | `99991001094399` | yes |

| Header | Value | Required |
| --- | --- | --- |
| `authorization` | redacted | yes |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "type": "boolean"
    },
    "result": {
      "type": "boolean"
    }
  },
  "required": [
    "result",
    "data"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": true,
  "result": true
}
```

**Bindings** (2)

- `path analyticId` comes from `GET /bc/v1/app-services/account` `response.body $.data.accounts[0].accountNumber` (seen 10x)
- `header authorization` comes from `POST /bc/v1/app-services/authenticate` `response.body $.data.securityToken` (seen 10x)

**Observed in** (10)

- Read-only tour, step `open-start`, run `20261104T213727Z-251f`, 2026-11-04T21:37:30.937Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2191:0`
- Read-only tour, step `open-3`, run `20261104T213727Z-251f`, 2026-11-04T21:37:39.667Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2387:0`
- Read-only tour, step `open-7`, run `20261104T213727Z-251f`, 2026-11-04T21:37:55.524Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2768:0`
- Read-only tour, step `open-start`, run `20261104T213945Z-3040`, 2026-11-04T21:39:48.195Z, exchange `51C197BF8E6E7F516F839DCE3A6FCF4E:339524.3144:0`
- Read-only tour, step `open-3`, run `20261104T213945Z-3040`, 2026-11-04T21:39:57.255Z, exchange `51C197BF8E6E7F516F839DCE3A6FCF4E:339524.3340:0`
- Read-only tour, step `open-7`, run `20261104T213945Z-3040`, 2026-11-04T21:40:14.233Z, exchange `51C197BF8E6E7F516F839DCE3A6FCF4E:339524.3721:0`
- Read-only tour, step `open-11`, run `20261104T213945Z-3040`, 2026-11-04T21:40:30.108Z, exchange `51C197BF8E6E7F516F839DCE3A6FCF4E:339524.4095:0`
- Read-only tour, step `open-12`, run `20261104T213945Z-3040`, 2026-11-04T21:40:34.720Z, exchange `51C197BF8E6E7F516F839DCE3A6FCF4E:339524.4206:0`
- Read-only tour, step `open-13`, run `20261104T213945Z-3040`, 2026-11-04T21:40:39.097Z, exchange `51C197BF8E6E7F516F839DCE3A6FCF4E:339524.4302:0`
- YP Metrics tour, step `open-portal`, run `20261104T214824Z-f674`, 2026-11-04T21:48:27.770Z, exchange `6529301EEA3C0CAD3EE709F53337745E:339524.4515:0`

## Background traffic (3)

### `GET /bc/v1/app-services/account`

Host: `ypapi.ypcloud.io` (background) (CORS)

| Name | In | Source | Example | Required |
| --- | --- | --- | --- | --- |
| `search` | query | binding | `{redacted}` | yes |

| Header | Value | Required |
| --- | --- | --- |
| `authorization` | redacted | yes |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "properties": {
        "accounts": {
          "items": {
            "properties": {
              "accountName": {
                "type": "string"
              },
              "accountNumber": {
                "type": "string"
              },
              "billRouting": {
                "type": "string"
              },
              "billingDenied": {
                "type": "string"
              },
              "billingInfo": {
                "properties": {
                  "balance": {
                    "type": "string"
                  },
                  "billingCompany": {
                    "type": "string"
                  },
                  "eBilling": {
                    "type": "boolean"
                  },
                  "email": {
                    "format": "email",
                    "type": "string"
                  },
                  "id": {
                    "type": "string"
                  },
                  "language": {
                    "type": "string"
                  },
                  "lastDueDate": {
                    "type": "string"
                  },
                  "locality": {
                    "type": "string"
                  },
                  "name": {
                    "type": "string"
                  },
                  "postalCode": {
                    "type": "string"
                  },
                  "primaryProfile": {
                    "type": "boolean"
                  },
                  "recordTypeId": {
                    "type": "string"
                  },
                  "region": {
                    "type": "string"
                  },
                  "sfId": {
                    "type": "string"
                  },
                  "streetAddress": {
                    "type": "string"
                  },
                  "zuoraAccountId": {
                    "type": "string"
                  },
                  "zuoraAccountNumber": {
                    "type": "string"
                  }
                },
                "required": [
                  "id",
                  "sfId",
                  "name",
                  "email",
                  "language",
                  "locality",
                  "region",
                  "postalCode",
                  "streetAddress",
                  "recordTypeId",
                  "billingCompany",
                  "eBilling",
                  "primaryProfile",
                  "balance",
                  "lastDueDate",
                  "zuoraAccountNumber",
                  "zuoraAccountId"
                ],
                "type": "object"
              },
              "contacts": {
                "items": {
                  "properties": {
                    "canLogin": {
                      "type": "boolean"
                    },
                    "email": {
                      "type": "string"
                    },
                    "firstName": {
                      "type": "string"
                    },
                    "id": {
                      "type": "string"
                    },
                    "languagePreference": {
                      "type": "string"
                    },
                    "lastName": {
                      "type": "string"
                    },
                    "phone": {
                      "type": "string"
                    },
                    "signAuth": {
                      "type": "boolean"
                    },
                    "title": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "id",
                    "title",
                    "phone",
                    "firstName",
                    "lastName",
                    "signAuth",
                    "email",
                    "canLogin",
                    "languagePreference"
                  ],
                  "type": "object"
                },
                "type": "array"
              },
              "merchants": {
                "items": {
                  "properties": {
                    "address": {
                      "type": "string"
                    },
                    "fullAddress": {
                      "properties": {
                        "addressLine": {
                          "type": "string"
                        },
                        "city": {
                          "type": "string"
                        },
                        "country": {
                          "type": "string"
                        },
                        "postalCodeZip": {
                          "type": "string"
                        },
                        "region": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "addressLine",
                        "city",
                        "region",
                        "country",
                        "postalCodeZip"
                      ],
                      "type": "object"
                    },
                    "merchantId": {
                      "type": "string"
                    },
                    "name": {
                      "properties": {
                        "en": {
                          "type": "string"
                        },
                        "fr": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "en",
                        "fr"
                      ],
                      "type": "object"
                    },
                    "phone": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "merchantId",
                    "name",
                    "address",
                    "fullAddress",
                    "phone"
                  ],
                  "type": "object"
                },
                "type": "array"
              },
              "phone": {
                "type": "string"
              },
              "postalAddress": {
                "properties": {
                  "addressLine": {
                    "type": "string"
                  },
                  "city": {
                    "type": "string"
                  },
                  "country": {
                    "type": "string"
                  },
                  "postalCodeZip": {
                    "type": "string"
                  },
                  "region": {
                    "type": "string"
                  }
                },
                "required": [
                  "addressLine",
                  "city",
                  "region",
                  "country",
                  "postalCodeZip"
                ],
                "type": "object"
              },
              "salesRep": {
                "properties": {
                  "email": {
                    "format": "email",
                    "type": "string"
                  },
                  "id": {
                    "type": "string"
                  },
                  "name": {
                    "type": "string"
                  },
                  "phone": {
                    "type": "string"
                  }
                },
                "required": [
                  "id",
                  "name",
                  "email",
                  "phone"
                ],
                "type": "object"
              },
              "sfLink": {
                "format": "uri",
                "type": "string"
              }
            },
            "required": [
              "sfLink",
              "accountNumber",
              "accountName",
              "postalAddress",
              "phone",
              "contacts",
              "merchants",
              "salesRep",
              "billingInfo",
              "billRouting",
              "billingDenied"
            ],
            "type": "object"
          },
          "type": "array"
        }
      },
      "required": [
        "accounts"
      ],
      "type": "object"
    },
    "result": {
      "type": "boolean"
    }
  },
  "required": [
    "result",
    "data"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": {
    "accounts": [
      {
        "accountName": "Roof Doctor",
        "accountNumber": "{redacted}",
        "billRouting": "Zuora",
        "billingDenied": "false",
        "billingInfo": {
          "balance": "17321.62",
          "billingCompany": "Roof Doctor",
          "eBilling": true,
          "email": "{redacted}",
          "id": "001i000000egZyAAAU",
          "language": "English",
          "lastDueDate": "2025-12-02",
          "locality": "KELOWNA",
          "name": "",
          "postalCode": "{redacted}",
          "primaryProfile": true,
          "recordTypeId": "012i0000000yRNaAAM",
          "region": "BC",
          "sfId": "001i000000egZyAAAU",
          "streetAddress": "3-715 EVANS CRT",
          "zuoraAccountId": "{redacted}",
          "zuoraAccountNumber": "A01365433"
        },
        "contacts": [
          {
            "canLogin": false,
            "email": "{redacted}",
            "firstName": "{redacted}",
            "id": "0031Y00005Uqr4zQAB",
            "languagePreference": "EN",
            "lastName": "{redacted}",
            "phone": "{redacted}",
            "signAuth": false,
            "title": ""
          },
          {
            "canLogin": false,
            "email": "{redacted}",
            "firstName": "{redacted}",
            "id": "003OK00000fcQBZYA2",
            "languagePreference": "EN",
            "lastName": "{redacted}",
            "phone": "{redacted}",
            "signAuth": true,
            "title": ""
          }
        ],
        "merchants": [
          {
            "address": "{redacted}",
            "fullAddress": {
              "addressLine": "{redacted}",
              "city": "Kelowna",
              "country": "Canada",
              "postalCodeZip": "{redacted}",
              "region": "BC"
            },
            "merchantId": "4302054",
            "name": {
              "en": "Roof Doctor",
              "fr": "Roof Doctor"
            },
            "phone": "{redacted}"
          },
          {
            "address": "{redacted}",
            "fullAddress": {
              "addressLine": "{redacted}",
              "city": "",
              "country": "Canada",
              "postalCodeZip": "{redacted}",
              "region": "BC"
            },
            "merchantId": "100172501",
            "name": {
              "en": "Roof Doctor",
              "fr": "Roof Doctor"
            },
            "phone": "{redacted}"
          }
        ],
        "phone": "{redacted}",
        "postalAddress": {
          "addressLine": "{redacted}",
          "city": "KELOWNA",
          "country": "CA",
          "postalCodeZip": "{redacted}",
          "region": "BC"
        },
        "salesRep": {
          "email": "{redacted}",
          "id": "005i0000001yBjEAAU",
          "name": "Derek Dennis",
          "phone": "{redacted}"
        },
        "sfLink": "https://yp-pj.my.salesforce.com/001i000000egZyAAAU"
      }
    ]
  },
  "result": true
}
```

**Bindings** (7)

- `query search` comes from `POST /bc/v1/app-services/authenticate` `response.body $.data.uid` (seen 24x)
- `header authorization` comes from `POST /bc/v1/app-services/authenticate` `response.body $.data.securityToken` (seen 24x)
- `response.body $.data.accounts[0].contacts[6].email` feeds `GET /overview` `query email`
- `response.body $.data.accounts[0].accountNumber` feeds `GET /bc/v1/app-services/account/{accountId}/bank-hours` `path accountId`
- `response.body $.data.accounts[0].merchants[0].merchantId` feeds `GET /bc/v1/app-services/merchant/{merchantId}/assets` `path merchantId`
- `response.body $.data.accounts[0].merchants[1].merchantId` feeds `GET /bc/v1/app-services/merchant/{merchantId}/assets` `path merchantId`
- `response.body $.data.accounts[0].accountNumber` feeds `GET /bc/v1/app-services/url/analytics/{analyticId}` `path analyticId`

**Observed in** (24)

- Read-only tour, step `open-start`, run `20261104T213727Z-251f`, 2026-11-04T21:37:30.430Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2188:0`
- Read-only tour, step `open-2`, run `20261104T213727Z-251f`, 2026-11-04T21:37:35.442Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2292:0`
- Read-only tour, step `open-3`, run `20261104T213727Z-251f`, 2026-11-04T21:37:39.187Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2384:0`
- Read-only tour, step `open-4`, run `20261104T213727Z-251f`, 2026-11-04T21:37:43.447Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2487:0`
- Read-only tour, step `open-5`, run `20261104T213727Z-251f`, 2026-11-04T21:37:47.621Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2580:0`
- Read-only tour, step `open-6`, run `20261104T213727Z-251f`, 2026-11-04T21:37:51.308Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2673:0`
- Read-only tour, step `open-7`, run `20261104T213727Z-251f`, 2026-11-04T21:37:55.035Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2766:0`
- Read-only tour, step `open-8`, run `20261104T213727Z-251f`, 2026-11-04T21:37:59.338Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2862:0`
- Read-only tour, step `open-9`, run `20261104T213727Z-251f`, 2026-11-04T21:38:03.033Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2954:0`
- Read-only tour, step `open-10`, run `20261104T213727Z-251f`, 2026-11-04T21:38:07.176Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.3047:0`
- Read-only tour, step `open-start`, run `20261104T213945Z-3040`, 2026-11-04T21:39:47.720Z, exchange `51C197BF8E6E7F516F839DCE3A6FCF4E:339524.3141:0`
- Read-only tour, step `open-2`, run `20261104T213945Z-3040`, 2026-11-04T21:39:52.664Z, exchange `51C197BF8E6E7F516F839DCE3A6FCF4E:339524.3245:0`
- and 12 more

### `POST /bc/v1/app-services/authenticate`

Host: `ypapi.ypcloud.io` (background) (CORS)

**Request**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "login": {
      "type": "string"
    }
  },
  "required": [
    "login"
  ],
  "type": "object"
}
```

Example:

```json
{
  "login": "{redacted}"
}
```

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "properties": {
        "capabilities": {
          "properties": {
            "account": {
              "properties": {
                "search": {
                  "properties": {
                    "contactEmail": {
                      "properties": {
                        "access": {
                          "type": "integer"
                        },
                        "all": {
                          "properties": {
                            "access": {
                              "type": "integer"
                            }
                          },
                          "required": [
                            "access"
                          ],
                          "type": "object"
                        },
                        "publishedOnly": {
                          "type": "boolean"
                        }
                      },
                      "required": [
                        "publishedOnly",
                        "access",
                        "all"
                      ],
                      "type": "object"
                    },
                    "id": {
                      "properties": {
                        "access": {
                          "type": "integer"
                        },
                        "all": {
                          "properties": {
                            "access": {
                              "type": "integer"
                            }
                          },
                          "required": [
                            "access"
                          ],
                          "type": "object"
                        },
                        "authorizeStrategy": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "access",
                        "all",
                        "authorizeStrategy"
                      ],
                      "type": "object"
                    },
                    "phoneOrName": {
                      "properties": {
                        "access": {
                          "type": "integer"
                        },
                        "all": {
                          "properties": {
                            "access": {
                              "type": "integer"
                            }
                          },
                          "required": [
                            "access"
                          ],
                          "type": "object"
                        }
                      },
                      "required": [
                        "access",
                        "all"
                      ],
                      "type": "object"
                    },
                    "ui": {
                      "properties": {
                        "access": {
                          "type": "integer"
                        },
                        "defaultExpandedList": {
                          "type": "boolean"
                        }
                      },
                      "required": [
                        "defaultExpandedList",
                        "access"
                      ],
                      "type": "object"
                    }
                  },
                  "required": [
                    "ui",
                    "id",
                    "contactEmail",
                    "phoneOrName"
                  ],
                  "type": "object"
                }
              },
              "required": [
                "search"
              ],
              "type": "object"
            },
            "analytics": {
              "properties": {
                "type": {
                  "type": "string"
                }
              },
              "required": [
                "type"
              ],
              "type": "object"
            },
            "content": {
              "properties": {
                "ui": {
                  "properties": {
                    "access": {
                      "type": "integer"
                    }
                  },
                  "required": [
                    "access"
                  ],
                  "type": "object"
                }
              },
              "required": [
                "ui"
              ],
              "type": "object"
            },
            "dashboard": {
              "properties": {
                "ui": {
                  "properties": {
                    "access": {
                      "type": "integer"
                    }
                  },
                  "required": [
                    "access"
                  ],
                  "type": "object"
                }
              },
              "required": [
                "ui"
              ],
              "type": "object"
            },
            "impersonate": {
              "properties": {
                "ui": {
                  "properties": {
                    "access": {
                      "type": "integer"
                    }
                  },
                  "required": [
                    "access"
                  ],
                  "type": "object"
                }
              },
              "required": [
                "ui"
              ],
              "type": "object"
            },
            "review": {
              "properties": {
                "ui": {
                  "properties": {
                    "comments": {
                      "properties": {
                        "access": {
                          "type": "integer"
                        }
                      },
                      "required": [
                        "access"
                      ],
                      "type": "object"
                    }
                  },
                  "required": [
                    "comments"
                  ],
                  "type": "object"
                }
              },
              "required": [
                "ui"
              ],
              "type": "object"
            },
            "settings": {
              "properties": {
                "ui": {
                  "properties": {
                    "password": {
                      "properties": {
                        "access": {
                          "type": "integer"
                        }
                      },
                      "required": [
                        "access"
                      ],
                      "type": "object"
                    }
                  },
                  "required": [
                    "password"
                  ],
                  "type": "object"
                }
              },
              "required": [
                "ui"
              ],
              "type": "object"
            },
            "toolbox": {
              "properties": {
                "ui": {
                  "properties": {
                    "navigateToOldBc": {
                      "properties": {
                        "access": {
                          "type": "integer"
                        }
                      },
                      "required": [
                        "access"
                      ],
                      "type": "object"
                    }
                  },
                  "required": [
                    "navigateToOldBc"
                  ],
                  "type": "object"
                }
              },
              "required": [
                "ui"
              ],
              "type": "object"
            }
          },
          "required": [
            "account",
            "content",
            "dashboard",
            "impersonate",
            "toolbox",
            "review",
            "settings",
            "analytics"
          ],
          "type": "object"
        },
        "email": {
          "format": "email",
          "type": "string"
        },
        "profiles": {
          "items": {
            "properties": {
              "capabilities": {
                "properties": {
                  "account": {
                    "properties": {
                      "search": {
                        "properties": {
                          "contactEmail": {
                            "properties": {
                              "access": {
                                "type": "integer"
                              },
                              "all": {
                                "type": "object"
                              },
                              "publishedOnly": {
                                "type": "boolean"
                              }
                            },
                            "required": [
                              "publishedOnly",
                              "access",
                              "all"
                            ],
                            "type": "object"
                          },
                          "id": {
                            "properties": {
                              "access": {
                                "type": "integer"
                              },
                              "all": {
                                "type": "object"
                              },
                              "authorizeStrategy": {
                                "type": "string"
                              }
                            },
                            "required": [
                              "access",
                              "all",
                              "authorizeStrategy"
                            ],
                            "type": "object"
                          },
                          "phoneOrName": {
                            "properties": {
                              "access": {
                                "type": "integer"
                              },
                              "all": {
                                "type": "object"
                              }
                            },
                            "required": [
                              "access",
                              "all"
                            ],
                            "type": "object"
                          },
                          "ui": {
                            "properties": {
                              "access": {
                                "type": "integer"
                              },
                              "defaultExpandedList": {
                                "type": "boolean"
                              }
                            },
                            "required": [
                              "defaultExpandedList",
                              "access"
                            ],
                            "type": "object"
                          }
                        },
                        "required": [
                          "ui",
                          "id",
                          "contactEmail",
                          "phoneOrName"
                        ],
                        "type": "object"
                      }
                    },
                    "required": [
                      "search"
                    ],
                    "type": "object"
                  },
                  "analytics": {
                    "properties": {
                      "type": {
                        "type": "string"
                      }
                    },
                    "required": [
                      "type"
                    ],
                    "type": "object"
                  },
                  "content": {
                    "properties": {
                      "ui": {
                        "properties": {
                          "access": {
                            "type": "integer"
                          }
                        },
                        "required": [
                          "access"
                        ],
                        "type": "object"
                      }
                    },
                    "required": [
                      "ui"
                    ],
                    "type": "object"
                  },
                  "dashboard": {
                    "properties": {
                      "ui": {
                        "properties": {
                          "access": {
                            "type": "integer"
                          }
                        },
                        "required": [
                          "access"
                        ],
                        "type": "object"
                      }
                    },
                    "required": [
                      "ui"
                    ],
                    "type": "object"
                  },
                  "impersonate": {
                    "properties": {
                      "ui": {
                        "properties": {
                          "access": {
                            "type": "integer"
                          }
                        },
                        "required": [
                          "access"
                        ],
                        "type": "object"
                      }
                    },
                    "required": [
                      "ui"
                    ],
                    "type": "object"
                  },
                  "review": {
                    "properties": {
                      "ui": {
                        "properties": {
                          "comments": {
                            "properties": {
                              "access": {
                                "type": "integer"
                              }
                            },
                            "required": [
                              "access"
                            ],
                            "type": "object"
                          }
                        },
                        "required": [
                          "comments"
                        ],
                        "type": "object"
                      }
                    },
                    "required": [
                      "ui"
                    ],
                    "type": "object"
                  },
                  "settings": {
                    "properties": {
                      "ui": {
                        "properties": {
                          "password": {
                            "properties": {
                              "access": {
                                "type": "integer"
                              }
                            },
                            "required": [
                              "access"
                            ],
                            "type": "object"
                          }
                        },
                        "required": [
                          "password"
                        ],
                        "type": "object"
                      }
                    },
                    "required": [
                      "ui"
                    ],
                    "type": "object"
                  },
                  "toolbox": {
                    "properties": {
                      "ui": {
                        "properties": {
                          "navigateToOldBc": {
                            "properties": {
                              "access": {
                                "type": "integer"
                              }
                            },
                            "required": [
                              "access"
                            ],
                            "type": "object"
                          }
                        },
                        "required": [
                          "navigateToOldBc"
                        ],
                        "type": "object"
                      }
                    },
                    "required": [
                      "ui"
                    ],
                    "type": "object"
                  }
                },
                "required": [
                  "account",
                  "content",
                  "dashboard",
                  "impersonate",
                  "toolbox",
                  "review",
                  "settings",
                  "analytics"
                ],
                "type": "object"
              },
              "persona": {
                "type": "string"
              }
            },
            "required": [
              "persona",
              "capabilities"
            ],
            "type": "object"
          },
          "type": "array"
        },
        "securityToken": {
          "type": "string"
        },
        "uid": {
          "format": "email",
          "type": "string"
        }
      },
      "required": [
        "securityToken",
        "uid",
        "email",
        "profiles",
        "capabilities"
      ],
      "type": "object"
    },
    "result": {
      "type": "boolean"
    }
  },
  "required": [
    "result",
    "data"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": {
    "capabilities": {
      "account": {
        "search": {
          "contactEmail": {
            "access": 2,
            "all": {
              "access": 2
            },
            "publishedOnly": true
          },
          "id": {
            "access": 0,
            "all": {
              "access": 0
            },
            "authorizeStrategy": "{redacted}"
          },
          "phoneOrName": {
            "access": 0,
            "all": {
              "access": 0
            }
          },
          "ui": {
            "access": 0,
            "defaultExpandedList": false
          }
        }
      },
      "analytics": {
        "type": "advertiser"
      },
      "content": {
        "ui": {
          "access": 3
        }
      },
      "dashboard": {
        "ui": {
          "access": 3
        }
      },
      "impersonate": {
        "ui": {
          "access": 0
        }
      },
      "review": {
        "ui": {
          "comments": {
            "access": 3
          }
        }
      },
      "settings": {
        "ui": {
          "password": {
            "access": 3
          }
        }
      },
      "toolbox": {
        "ui": {
          "navigateToOldBc": {
            "access": 2
          }
        }
      }
    },
    "email": "{redacted}",
    "profiles": [
      {
        "capabilities": {
          "account": {
            "search": {
              "contactEmail": {
                "access": 2,
                "all": {
                  "access": 2
                },
                "publishedOnly": true
              },
              "id": {
                "access": 0,
                "all": {
                  "access": 0
                },
                "authorizeStrategy": "{redacted}"
              },
              "phoneOrName": {
                "access": 0,
                "all": {
                  "access": 0
                }
              },
              "ui": {
                "access": 0,
                "defaultExpandedList": false
              }
            }
          },
          "analytics": {
            "type": "advertiser"
          },
          "content": {
            "ui": {
              "access": 3
            }
          },
          "dashboard": {
            "ui": {
              "access": 3
            }
          },
          "impersonate": {
            "ui": {
              "access": 0
            }
          },
          "review": {
            "ui": {
              "comments": {
                "access": 3
              }
            }
          },
          "settings": {
            "ui": {
              "password": {
                "access": 3
              }
            }
          },
          "toolbox": {
            "ui": {
              "navigateToOldBc": {
                "access": 2
              }
            }
          }
        },
        "persona": "advertiser"
      }
    ],
    "securityToken": "{redacted}",
    "uid": "{redacted}"
  },
  "result": true
}
```

**Bindings** (8)

- `body $.login` comes from `storage` `storage localStorage[msal.idtoken]` (seen 24x)
- `response.body $.data.securityToken` feeds `GET /overview` `query token`
- `response.body $.data.uid` feeds `GET /bc/v1/app-services/account` `query search`
- `response.body $.data.securityToken` feeds `GET /bc/v1/app-services/account` `header authorization`
- `response.body $.data.securityToken` feeds `GET /bc/v1/app-services/account/{accountId}/bank-hours` `header authorization`
- `response.body $.data.securityToken` feeds `GET /bc/v1/app-services/maintenance` `header authorization`
- `response.body $.data.securityToken` feeds `GET /bc/v1/app-services/merchant/{merchantId}/assets` `header authorization`
- `response.body $.data.securityToken` feeds `GET /bc/v1/app-services/url/analytics/{analyticId}` `header authorization`

**Observed in** (24)

- Read-only tour, step `open-start`, run `20261104T213727Z-251f`, 2026-11-04T21:37:30.220Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2175:0`
- Read-only tour, step `open-2`, run `20261104T213727Z-251f`, 2026-11-04T21:37:35.261Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2279:0`
- Read-only tour, step `open-3`, run `20261104T213727Z-251f`, 2026-11-04T21:37:39.008Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2371:0`
- Read-only tour, step `open-4`, run `20261104T213727Z-251f`, 2026-11-04T21:37:43.232Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2474:0`
- Read-only tour, step `open-5`, run `20261104T213727Z-251f`, 2026-11-04T21:37:47.072Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2567:0`
- Read-only tour, step `open-6`, run `20261104T213727Z-251f`, 2026-11-04T21:37:51.125Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2660:0`
- Read-only tour, step `open-7`, run `20261104T213727Z-251f`, 2026-11-04T21:37:54.825Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2753:0`
- Read-only tour, step `open-8`, run `20261104T213727Z-251f`, 2026-11-04T21:37:59.119Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2849:0`
- Read-only tour, step `open-9`, run `20261104T213727Z-251f`, 2026-11-04T21:38:02.846Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2941:0`
- Read-only tour, step `open-10`, run `20261104T213727Z-251f`, 2026-11-04T21:38:06.979Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.3034:0`
- Read-only tour, step `open-start`, run `20261104T213945Z-3040`, 2026-11-04T21:39:47.539Z, exchange `51C197BF8E6E7F516F839DCE3A6FCF4E:339524.3128:0`
- Read-only tour, step `open-2`, run `20261104T213945Z-3040`, 2026-11-04T21:39:52.448Z, exchange `51C197BF8E6E7F516F839DCE3A6FCF4E:339524.3232:0`
- and 12 more

### `GET /bc/v1/app-services/maintenance`

Host: `ypapi.ypcloud.io` (background) (CORS)

| Header | Value | Required |
| --- | --- | --- |
| `authorization` | redacted | yes |

**Response 200**

Media type: `application/json`

Schema:

```json
{
  "properties": {
    "data": {
      "properties": {
        "lastUpdate": {
          "format": "date-time",
          "type": "string"
        },
        "status": {
          "type": "boolean"
        }
      },
      "required": [
        "status",
        "lastUpdate"
      ],
      "type": "object"
    },
    "result": {
      "type": "boolean"
    }
  },
  "required": [
    "result",
    "data"
  ],
  "type": "object"
}
```

Example:

```json
{
  "data": {
    "lastUpdate": "2026-07-12T20:52:47.619Z",
    "status": false
  },
  "result": true
}
```

**Bindings** (1)

- `header authorization` comes from `POST /bc/v1/app-services/authenticate` `response.body $.data.securityToken` (seen 42x)

**Observed in** (42)

- Read-only tour, step `open-start`, run `20261104T213727Z-251f`, 2026-11-04T21:37:30.325Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2187:0`
- Read-only tour, step `open-start`, run `20261104T213727Z-251f`, 2026-11-04T21:37:30.953Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2202:0`
- Read-only tour, step `open-2`, run `20261104T213727Z-251f`, 2026-11-04T21:37:35.348Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2291:0`
- Read-only tour, step `open-2`, run `20261104T213727Z-251f`, 2026-11-04T21:37:35.954Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2301:0`
- Read-only tour, step `open-3`, run `20261104T213727Z-251f`, 2026-11-04T21:37:39.097Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2383:0`
- Read-only tour, step `open-3`, run `20261104T213727Z-251f`, 2026-11-04T21:37:39.680Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2398:0`
- Read-only tour, step `open-4`, run `20261104T213727Z-251f`, 2026-11-04T21:37:43.342Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2486:0`
- Read-only tour, step `open-4`, run `20261104T213727Z-251f`, 2026-11-04T21:37:43.988Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2497:0`
- Read-only tour, step `open-5`, run `20261104T213727Z-251f`, 2026-11-04T21:37:47.500Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2579:0`
- Read-only tour, step `open-6`, run `20261104T213727Z-251f`, 2026-11-04T21:37:51.219Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2672:0`
- Read-only tour, step `open-7`, run `20261104T213727Z-251f`, 2026-11-04T21:37:54.936Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2765:0`
- Read-only tour, step `open-7`, run `20261104T213727Z-251f`, 2026-11-04T21:37:55.535Z, exchange `8EEA15609EC3F21567923C17D7633CF0:339524.2777:0`
- and 30 more
