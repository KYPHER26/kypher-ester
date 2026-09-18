// Photo uploads need a Firebase Storage bucket + the Blaze billing plan.
// Until that's set up, this stays false and the app hides upload UI
// instead of erroring when someone taps "Add Photos". Flip it on in
// .env (VITE_PHOTOS_ENABLED=true) once Storage is provisioned.
export const PHOTOS_ENABLED = import.meta.env.VITE_PHOTOS_ENABLED === 'true';
