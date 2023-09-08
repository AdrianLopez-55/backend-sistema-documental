export default () => ({
  api_central: process.env.API_CENTRAL,
  verify_token: process.env.API_CENTRAL,
  port: process.env.PORT || 3600,
  apiKey: process.env.API_KEY,
  mongodb: process.env.MONGO_URI,
  db_name: process.env.DB_NAME,
  api_files_uploader: process.env.API_FILES_UPLOADER,
  api_files_template: process.env.API_FILES_TEMPLATE,
  api_personal: process.env.API_PERSONAL,
  api_personal_get: process.env.API_PERSONAL_GET,
  api_organization_chart_main: process.env.API_ORGANIZATION_CHART_MAIN,
  api_organization_chart_id: process.env.API_ORGANIZATION_CHART_ID,
  api_personal_get_ci: process.env.API_PERSONAL_GET_CI,
  api_rol_id: process.env.API_ROL_ID,
});
