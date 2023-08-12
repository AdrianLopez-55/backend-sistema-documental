export default () => ({
	apiKey: process.env.API_KEY,
	port: process.env.PORT || 3600,
	verify_token: process.env.API_CENTRAL,
	file_upload: process.env.API_FILES_UPLOADER,
	api_personal: process.env.API_PERSONAL,
	api_personal_get: process.env.API_PERSONAL_GET,
	mongodb: process.env.MONGO_URI,
	api_organization_chart: process.env.API_ORGANIZATION_CHART ,
	api_central: process.env.API_CENTRAL
});