const fs = require('fs');
const path = require('path');

const hookPath = path.join(__dirname, 'src', 'hooks', 'useFavoriteCampaigns.ts');

if (fs.existsSync(hookPath)) {
  fs.unlinkSync(hookPath);
  console.log('Successfully deleted useFavoriteCampaigns.ts');
} else {
  console.log('File not found:', hookPath);
}
