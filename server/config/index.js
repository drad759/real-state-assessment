const realEstateProfile = require('./businessProfiles/realEstate.json');

const getBusinessProfile = (industry) => {
  switch(industry) {
    case 'realEstate':
      return realEstateProfile;
    default:
      throw new Error('Unsupported business profile');
  }
};

module.exports = {
  getBusinessProfile
};