import {
  markAgentChatHomeHandoff,
  navigateWithAgentChatViewTransition,
} from "@agent-native/core/client/agent-chat";
import { createAgentNativeAgentKitTransport } from "@agent-native/core/client/agentkit-chat/transport";
import { useT } from "@agent-native/core/client/i18n";
import { AgentKitComposer } from "@agent-native/toolkit/app/agentkit/react/components";
import { useAgentKitControl } from "@agent-native/toolkit/app/agentkit/react/context";
import { CoreComposerRuntimeProvider } from "@agent-native/toolkit/app/chat/agentkit-chat/composer";
import { CoreAgentKitRoot } from "@agent-native/toolkit/app/chat/agentkit-chat/index";
import { useState } from "react";
import { useNavigate } from "react-router";

import { getChatHomeThreadId } from "@/lib/chat-home-thread";
import {
  chatThreadPath,
  type ChatInitialComposerOptions,
  type ChatRouteState,
} from "@/lib/chat-paths";
import { TAB_ID } from "@/lib/tab-id";

const INLINE_COMPOSER_STYLE = {
  display: "block",
  blockSize: "auto",
  overflow: "visible",
  background: "transparent",
} as const;

/**
 * The same AgentKit composer the chat page uses, so Connect AI and the model
 * picker look the way they will in chat. Submitting hands the prompt to the
 * full chat page instead of running it here.
 */
export default function HomeAgentComposer() {
  const navigate = useNavigate();
  const [threadId] = useState(getChatHomeThreadId);
  const [mode, setMode] = useState<"act" | "plan">("act");
  const [transport] = useState(() =>
    createAgentNativeAgentKitTransport({
      browserTabId: TAB_ID,
      surface: "app",
      adapter: { textFormat: "markdown" },
    }),
  );

  function openChat(
    message: string,
    options: ChatInitialComposerOptions,
    onLocalSubmit?: () => void,
  ) {
    const state: ChatRouteState = {
      initialMessage: message,
      initialComposerOptions: options,
    };
    markAgentChatHomeHandoff("chat");
    navigateWithAgentChatViewTransition(navigate, chatThreadPath(threadId), {
      state,
    });
    onLocalSubmit?.();
  }

  return (
    // `agentkit-chat` carries the page composer's sizing tokens. Its stylesheet
    // is unlayered, so Tailwind utilities can't undo the transcript canvas
    // (background, full-height grid); only inline styles win here.
    <div
      className="agentkit-chat w-full max-w-2xl text-start"
      style={INLINE_COMPOSER_STYLE}
    >
      <div className="agentkit-composer-stack">
        <CoreComposerRuntimeProvider>
          <CoreAgentKitRoot
            transport={transport}
            clientOptions={{ transportOwnership: "owned" }}
            threadId={threadId}
          >
            <HomeAgentComposerInput
              threadId={threadId}
              mode={mode}
              onModeChange={setMode}
              onSubmit={openChat}
            />
          </CoreAgentKitRoot>
        </CoreComposerRuntimeProvider>
      </div>
    </div>
  );
}

function HomeAgentComposerInput({
  threadId,
  mode,
  onModeChange,
  onSubmit,
}: {
  threadId: string;
  mode: "act" | "plan";
  onModeChange: (mode: "act" | "plan") => void;
  onSubmit: (
    text: string,
    options: ChatInitialComposerOptions,
    onLocalSubmit?: () => void,
  ) => void;
}) {
  const t = useT();
  const control = useAgentKitControl(threadId);

  return (
    <AgentKitComposer
      threadId={threadId}
      requireAgentEngine
      placeholder={t("home.composerPlaceholder")}
      plusMenuMode="hidden"
      attachmentsEnabled={false}
      mode={mode}
      onModeChange={onModeChange}
      voiceEnabled
      onSubmit={async (text, files, references, options) => {
        const uploadedAttachments = files.length
          ? await control.uploadFiles(
              files.map((file) => ({
                name: file.name,
                mediaType: file.type || "application/octet-stream",
                size: file.size,
                body: file,
              })),
            )
          : [];
        const {
          onLocalSubmit: clearLocalDraft,
          attachments: _rawAttachments,
          ...submitOptions
        } = options;
        onSubmit(
          text,
          {
            ...submitOptions,
            mode,
            references,
            ...(uploadedAttachments.length ? { uploadedAttachments } : {}),
          },
          clearLocalDraft,
        );
      }}
    />
  );
}
