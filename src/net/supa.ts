// The line to the online cafés: Supabase Realtime (open source, hosted in Frankfurt). Nothing is stored there:
// Broadcast passes messages between the people in a café, Presence keeps the list of who is in it.
// ponytail: public channels with the publishable key, so anyone who knows a café's code can walk in, as in a real
// café. Upgrade path if it gets abused: anonymous sign-ins plus RLS policies on realtime.messages, private channels.
import { RealtimeClient, type RealtimeChannel } from "@supabase/realtime-js";
import { t } from "../i18n";

export const HOST = "fikiiwkgyiljsnxcaagj.supabase.co";
const KEY = "sb_publishable_7DKiv70Ilo_RMlgxzncVDg_uc_GbCax"; // publishable: meant to sit in the page
let rc: RealtimeClient | null = null;

/** join a channel; resolves once it is live, rejects if the cafés can't be reached */
export function channel(topic: string, key: string, setup: (ch: RealtimeChannel) => void): Promise<RealtimeChannel> {
  rc ??= new RealtimeClient(`https://${HOST}/realtime/v1`, { params: { apikey: KEY } });
  const ch = rc.channel(topic, { config: { broadcast: { self: false }, presence: { key, enabled: true } } });
  setup(ch);
  return new Promise((ok, no) => {
    const timer = setTimeout(() => fail(), 12000),
      fail = () => {
        clearTimeout(timer);
        void rc?.removeChannel(ch);
        no(new Error(t("Can't reach the online cafés right now. Check your connection and try again.")));
      };
    ch.subscribe((st) => {
      if (st === "SUBSCRIBED") {
        clearTimeout(timer);
        ok(ch);
      } else if (st === "CHANNEL_ERROR" || st === "TIMED_OUT") fail();
    });
  });
}
export const drop = (ch: RealtimeChannel | null): void => void (ch && rc?.removeChannel(ch));
