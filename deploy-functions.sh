#!/bin/bash

# Deploy Azure Functions for Preview Code Management
# This script helps deploy the functions to your existing Azure backend

echo "🚀 Deploying Preview Code Management Functions to Azure"

# Check if Azure Functions Core Tools is installed
if ! command -v func &> /dev/null; then
    echo "❌ Azure Functions Core Tools not found"
    echo "📦 Installing Azure Functions Core Tools..."
    npm install -g azure-functions-core-tools@4
fi

# Navigate to functions directory
cd azure-functions

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if local.settings.json exists
if [ ! -f "local.settings.json" ]; then
    echo "⚙️  Creating local.settings.json template..."
    cat > local.settings.json << EOF
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_DB_ENDPOINT": "https://your-cosmos-account.documents.azure.com:443/",
    "COSMOS_DB_KEY": "your-cosmos-primary-key",
    "COSMOS_DB_DATABASE": "1task-database",
    "COSMOS_DB_CONTAINER": "preview-codes"
  }
}
EOF
    echo "⚠️  Please update local.settings.json with your Cosmos DB credentials"
fi

# Function to deploy
deploy_functions() {
    local app_name=$1
    
    echo "🔧 Deploying to Azure Function App: $app_name"
    
    # Deploy the functions
    func azure functionapp publish $app_name --javascript
    
    if [ $? -eq 0 ]; then
        echo "✅ Deployment successful!"
        echo "🌐 Your functions are now available at:"
        echo "   https://$app_name.azurewebsites.net/api/health"
        echo "   https://$app_name.azurewebsites.net/api/validate-preview-code"
        echo "   https://$app_name.azurewebsites.net/api/admin/preview-codes/stats"
        echo "   https://$app_name.azurewebsites.net/api/admin/preview-codes/bulk-load"
        echo "   https://$app_name.azurewebsites.net/api/admin/preview-codes/reset"
        
        echo ""
        echo "📋 Next steps:"
        echo "1. Configure Cosmos DB environment variables in Azure portal"
        echo "2. Test the health endpoint: curl https://$app_name.azurewebsites.net/api/health"
        echo "3. Load preview codes using the admin panel at /admin"
    else
        echo "❌ Deployment failed!"
        exit 1
    fi
}

# Get the function app name
if [ -z "$1" ]; then
    echo "📝 Please provide your Azure Function App name:"
    echo "   Based on your backend URL, it might be: 1task-backend-api-gse0fsgngtfxhjc6"
    echo ""
    echo "Usage: ./deploy-functions.sh <function-app-name>"
    echo "Example: ./deploy-functions.sh 1task-backend-api-gse0fsgngtfxhjc6"
    exit 1
else
    deploy_functions $1
fi
