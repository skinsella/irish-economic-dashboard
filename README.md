# Ireland economic dashboard

A static GitHub Pages dashboard for official Irish macroeconomic, financial and microeconomic data.

## Deployment

1. Create an empty GitHub repository
2. Push this directory to its `main` branch
3. In repository settings, select GitHub Actions as the Pages source
4. Run the `Refresh official data` workflow once

The workflow refreshes CSO series on weekdays and commits the validated snapshot. The Pages workflow deploys every push to `main`.

## Data boundary

The automated release contains CSO inflation, unemployment, real GDP, modified domestic demand, retail-sales volume and residential-property-price series. The Central Bank, Department of Finance and NTMA feeds are registered in the source catalogue but deliberately remain unrendered until their source-specific parsers are validated. This prevents a release from presenting scraped, mislabelled or incompatible financial and fiscal observations as official data.
