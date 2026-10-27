import HomeLoading from "@/components/home/HomeLoading";

export { signInLandingLoader as loader } from "@agent-native/core/client/sign-in-landing";

/** First paint while `/` decides local-dev vs sign-in redirect. */
export function HydrateFallback() {
  return <HomeLoading label="Starting Architect Refuse…" />;
}
