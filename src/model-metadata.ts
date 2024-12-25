export interface ModelMetadata {
  successed?: boolean;
  isOpen?: boolean;
  organization?: string;
  price?: number;
}

export type FilterStrategy = "showAll" | "hideDeprecated" | "hideOld" | "onePerOrg";

export function getFilterDescription(strategy: FilterStrategy): string {
  switch (strategy) {
    case "showAll":
      return "Never";
    case "hideDeprecated":
      return "Drop deprecated";
    case "hideOld":
      return "Drop old";
    case "onePerOrg":
      return "Best / org";
  }
}

export function shouldShowModel(
  model: string,
  metadata: ModelMetadata,
  strategy: FilterStrategy,
  allModels: Array<{ name: string; rating: number }>,
): boolean {
  switch (strategy) {
    case "showAll":
      return true;
    case "hideDeprecated":
      return !metadata.successed;
    case "hideOld": {
      if (metadata.successed) return false;
      if (!metadata.organization || !metadata.price) return true;

      const thisModelScore = allModels.find((m) => m.name === model)?.rating;
      if (!thisModelScore) return true;

      const price = metadata.price;
      const org = metadata.organization;
      return !allModels.some((other) => {
        const otherMeta = modelMetadata[other.name];
        if (otherMeta && otherMeta.organization == org && otherMeta.price) {
          return other.rating > thisModelScore && otherMeta.price <= price;
        }
        return false;
      });
    }
    case "onePerOrg":
      if (!metadata.organization) return true;
      const orgModels = allModels.filter(
        (m) => modelMetadata[m.name]?.organization === metadata.organization,
      );
      const bestOrgModel = orgModels.reduce((best, current) =>
        current.rating > best.rating ? current : best,
      );
      return bestOrgModel.name === model;
  }
}

export const modelMetadata: Record<string, ModelMetadata> = {
  "amazon-nova-lite-v1.0": { price: 0.06 + 2 * 0.24, organization: "Amazon" },
  "amazon-nova-micro-v1.0": { price: 0.035 + 2 * 0.14, organization: "Amazon" },
  "amazon-nova-pro-v1.0": { price: 0.8 + 2 * 3.2, organization: "Amazon" },
  "athene-70b-0725": { isOpen: true, organization: "NexusFlow" },
  "athene-v2-chat": { isOpen: true, organization: "NexusFlow" },
  "bard-jan-24-gemini-pro": { successed: true, organization: "Google" },
  "c4ai-aya-expanse-32b": { price: 0.5 + 2 * 1.5, isOpen: true, organization: "Cohere" },
  "c4ai-aya-expanse-8b": { price: 0.5 + 2 * 1.5, isOpen: true, organization: "Cohere" },
  "chatglm-6b": { isOpen: true },
  "chatglm2-6b": { isOpen: true },
  "chatglm3-6b": { isOpen: true },
  "chatgpt-4o-latest-20240808": { successed: true, organization: "OpenAI" },
  "chatgpt-4o-latest-20240903": { successed: true, organization: "OpenAI" },
  "chatgpt-4o-latest-20241120": { price: 2.5 + 2 * 10, organization: "OpenAI" },
  "claude-1": { organization: "Anthropic" },
  "claude-2.0": { price: 8 + 2 * 24, organization: "Anthropic" },
  "claude-2.1": { price: 8 + 2 * 24, organization: "Anthropic" },
  "claude-3-5-haiku-20241022": { price: 0.8 + 2 * 4, organization: "Anthropic" },
  "claude-3-5-sonnet-20240620": { price: 3 + 2 * 15, organization: "Anthropic" },
  "claude-3-5-sonnet-20241022": { price: 3 + 2 * 15, organization: "Anthropic" },
  "claude-3-haiku-20240307": { price: 0.25 + 2 * 1.25, organization: "Anthropic" },
  "claude-3-opus-20240229": { price: 15 + 2 * 75, organization: "Anthropic" },
  "claude-3-sonnet-20240229": { price: 3 + 2 * 15, organization: "Anthropic" },
  "claude-instant-1": { organization: "Anthropic" },
  "codellama-34b-instruct": { isOpen: true },
  "codellama-70b-instruct": { isOpen: true },
  "command-r": { price: 0.95 + 2 * 1.9, isOpen: true, organization: "Cohere" },
  "command-r-08-2024": { price: 0.1425 + 2 * 0.57, isOpen: true, organization: "Cohere" },
  "command-r-plus": { price: 2.85 + 2 * 14.25, isOpen: true, organization: "Cohere" },
  "command-r-plus-08-2024": { price: 2.375 + 2 * 9.5, isOpen: true, organization: "Cohere" },
  "dbrx-instruct-preview": { isOpen: true },
  "deepseek-coder-v2": { successed: true, isOpen: true, organization: "DeepSeek" },
  "deepseek-coder-v2-0724": { successed: true, isOpen: true, organization: "DeepSeek" },
  "deepseek-llm-67b-chat": { successed: true, isOpen: true, organization: "DeepSeek" },
  "deepseek-v2-api-0628": { successed: true, isOpen: true, organization: "DeepSeek" },
  "deepseek-v2.5": { price: 0.14 + 2 * 0.28, isOpen: true, organization: "DeepSeek" },
  "deepseek-v2.5-1210": { price: 0.14 + 2 * 0.28, isOpen: true, organization: "DeepSeek" },
  "dolly-v2-12b": { isOpen: true },
  "falcon-180b-chat": { isOpen: true },
  "fastchat-t5-3b": { isOpen: true },
  "gemini-1.5-flash-001": { successed: true, organization: "Google" },
  "gemini-1.5-flash-002": { organization: "Google" },
  "gemini-1.5-flash-8b-001": { organization: "Google" },
  "gemini-1.5-flash-8b-exp-0827": { successed: true, organization: "Google" },
  "gemini-1.5-flash-exp-0827": { successed: true, organization: "Google" },
  "gemini-1.5-pro-001": { successed: true, organization: "Google" },
  "gemini-1.5-pro-002": { organization: "Google" },
  "gemini-1.5-pro-api-0409-preview": { successed: true, organization: "Google" },
  "gemini-1.5-pro-exp-0801": { successed: true, organization: "Google" },
  "gemini-1.5-pro-exp-0827": { successed: true, organization: "Google" },
  "gemini-2.0-flash-exp": { organization: "Google" },
  "gemini-2.0-flash-thinking-exp-1219": { organization: "Google" },
  "gemini-advanced-0514": { organization: "Google" },
  "gemini-exp-1114": { successed: true, organization: "Google" },
  "gemini-exp-1121": { successed: true, organization: "Google" },
  "gemini-exp-1206": { organization: "Google" },
  "gemini-pro": { successed: true, organization: "Google" },
  "gemini-pro-dev-api": { successed: true, organization: "Google" },
  "gemma-1.1-2b-it": { successed: true, isOpen: true, organization: "Google Open" },
  "gemma-1.1-7b-it": { successed: true, isOpen: true, organization: "Google Open" },
  "gemma-2-27b-it": { price: 0.27 + 2 * 0.27, isOpen: true, organization: "Google Open" },
  "gemma-2-2b-it": { isOpen: true, organization: "Google Open" },
  "gemma-2-9b-it": { price: 0.03 + 2 * 0.06, isOpen: true, organization: "Google Open" },
  "gemma-2-9b-it-simpo": { isOpen: true, organization: "Google Open" },
  "gemma-2b-it": { successed: true, isOpen: true, organization: "Google Open" },
  "gemma-7b-it": { successed: true, isOpen: true, organization: "Google Open" },
  "glm-4-0116": { organization: "Zhipu" },
  "glm-4-0520": { organization: "Zhipu" },
  "glm-4-plus": { organization: "Zhipu" },
  "gpt-3.5-turbo-0125": { price: 0.5 + 2 * 1.5, organization: "OpenAI" },
  "gpt-3.5-turbo-0314": { price: 1.5 + 2 * 2, organization: "OpenAI" },
  "gpt-3.5-turbo-0613": { price: 1.5 + 2 * 2, organization: "OpenAI" },
  "gpt-3.5-turbo-1106": { price: 1 + 2 * 2, organization: "OpenAI" },
  "gpt-4-0125-preview": { price: 10 + 2 * 30, organization: "OpenAI" },
  "gpt-4-0314": { price: 30 + 2 * 60, organization: "OpenAI" },
  "gpt-4-0613": { price: 30 + 2 * 60, organization: "OpenAI" },
  "gpt-4-1106-preview": { price: 10 + 2 * 30, organization: "OpenAI" },
  "gpt-4-turbo-2024-04-09": { price: 10 + 2 * 30, organization: "OpenAI" },
  "gpt-4o-2024-05-13": { price: 5 + 2 * 15, organization: "OpenAI" },
  "gpt-4o-2024-08-06": { price: 2.5 + 2 * 10, organization: "OpenAI" },
  "gpt-4o-mini-2024-07-18": { price: 0.15 + 2 * 0.6, organization: "OpenAI" },
  "gpt4all-13b-snoozy": { isOpen: true },
  "granite-3.0-2b-instruct": { isOpen: true },
  "granite-3.0-8b-instruct": { isOpen: true },
  "grok-2-2024-08-13": { organization: "xAI" },
  "grok-2-mini-2024-08-13": { organization: "xAI" },
  "guanaco-33b": { isOpen: true },
  "internlm2_5-20b-chat": { isOpen: true },
  "internvl2-26b": { isOpen: true },
  "internvl2-4b": { isOpen: true },
  "jamba-1.5-large": { isOpen: true, organization: "AI21" },
  "jamba-1.5-mini": { isOpen: true, organization: "AI21" },
  "koala-13b": { isOpen: true },
  "llama-13b": { successed: true, isOpen: true, organization: "Meta" },
  "llama-2-13b-chat": { successed: true, isOpen: true, organization: "Meta" },
  "llama-2-70b-chat": { successed: true, isOpen: true, organization: "Meta" },
  "llama-2-7b-chat": { successed: true, isOpen: true, organization: "Meta" },
  "llama-3-70b-instruct": { price: 0.23 + 2 * 0.4, isOpen: true, organization: "Meta" },
  "llama-3-8b-instruct": { price: 0.03 + 2 * 0.06, isOpen: true, organization: "Meta" },
  "llama-3.1-405b-instruct-bf16": { price: 3 + 2 * 3, isOpen: true, organization: "Meta" },
  "llama-3.1-405b-instruct-fp8": { price: 0.8 + 2 * 0.8, isOpen: true, organization: "Meta" },
  "llama-3.1-70b-instruct": { price: 0.12 + 2 * 0.3, isOpen: true, organization: "Meta" },
  "llama-3.1-8b-instruct": { price: 0.02 + 2 * 0.05, isOpen: true, organization: "Meta" },
  "llama-3.1-nemotron-51b-instruct": { isOpen: true, organization: "NVIDIA" },
  "llama-3.1-nemotron-70b-instruct": { price: 0.12 + 0.6, isOpen: true, organization: "NVIDIA" },
  "llama-3.2-1b-instruct": { price: 0.01 + 2 * 0.02, isOpen: true, organization: "Meta" },
  "llama-3.2-3b-instruct": { price: 0.015 + 2 * 0.025, isOpen: true, organization: "Meta" },
  "llama-3.2-vision-11b-instruct": { isOpen: true, organization: "Meta" },
  "llama-3.2-vision-90b-instruct": { isOpen: true, organization: "Meta" },
  "llama-3.3-70b-instruct": { price: 0.12 + 2 * 0.3, isOpen: true, organization: "Meta" },
  "llama2-70b-steerlm-chat": { successed: true, isOpen: true, organization: "NVIDIA" },
  "llava-v1.6-34b": { isOpen: true },
  "minicpm-v-2_6": { isOpen: true },
  "ministral-8b-2410": { price: 0.1 + 2 * 0.1, isOpen: true, organization: "Mistral" },
  "mistral-7b-instruct": { price: 0.03 + 2 * 0.055, isOpen: true, organization: "Mistral" },
  "mistral-7b-instruct-v0.2": { price: 0.18 + 2 * 0.18, isOpen: true, organization: "Mistral" },
  "mistral-large-2402": { price: 2 + 2 * 6, organization: "Mistral" },
  "mistral-large-2407": { price: 2 + 2 * 6, isOpen: true, organization: "Mistral" },
  "mistral-large-2411": { price: 2 + 2 * 6, isOpen: true, organization: "Mistral" },
  "mistral-medium": { price: 2.75 + 2 * 8.1, organization: "Mistral" },
  "mistral-next": { organization: "Mistral" },
  "mixtral-8x22b-instruct-v0.1": { price: 0.9 + 2 * 0.9, isOpen: true, organization: "Mistral" },
  "mixtral-8x7b-instruct-v0.1": { price: 0.24 + 2 * 0.24, isOpen: true, organization: "Mistral" },
  "molmo-72b-0924": { isOpen: true, organization: "Allen" },
  "molmo-7b-d-0924": { isOpen: true, organization: "Allen" },
  "mpt-30b-chat": { isOpen: true },
  "mpt-7b-chat": { isOpen: true },
  "nemotron-4-340b-instruct": { isOpen: true, organization: "NVIDIA" },
  "nous-hermes-2-mixtral-8x7b-dpo": { isOpen: true },
  "o1-mini": { price: 3 + 2 * 12 * 4, organization: "OpenAI" },
  "o1-preview": { price: 15 + 2 * 60 * 4, organization: "OpenAI" },
  "oasst-pythia-12b": { isOpen: true },
  "olmo-7b-instruct": { isOpen: true },
  "openchat-3.5": { isOpen: true },
  "openchat-3.5-0106": { isOpen: true },
  "openhermes-2.5-mistral-7b": { isOpen: true },
  "palm-2": { organization: "Google" },
  "phi-3-medium-4k-instruct": { isOpen: true, organization: "Microsoft" },
  "phi-3-mini-128k-instruct": { isOpen: true, organization: "Microsoft" },
  "phi-3-mini-4k-instruct": { isOpen: true, organization: "Microsoft" },
  "phi-3-mini-4k-instruct-june-2024": { isOpen: true, organization: "Microsoft" },
  "phi-3-small-8k-instruct": { isOpen: true, organization: "Microsoft" },
  "phi-3-vision-128k-instruct": { isOpen: true, organization: "Microsoft" },
  "phi-3.5-vision-instruct": { isOpen: true, organization: "Microsoft" },
  "pixtral-12b-2409": { isOpen: true, organization: "Mistral" },
  "pixtral-large-2411": { isOpen: true, organization: "Mistral" },
  "qwen-14b-chat": { successed: true, isOpen: true, organization: "Qwen" },
  "qwen-max-0428": { price: 10 + 2 * 30, organization: "Qwen" },
  "qwen-max-0919": { price: 10 + 2 * 30, organization: "Qwen" },
  "qwen-plus-0828": { price: 3 + 2 * 9, organization: "Qwen" },
  "qwen-vl-max-1119": { organization: "Qwen" },
  "qwen1.5-110b-chat": { successed: true, isOpen: true, organization: "Qwen" },
  "qwen1.5-14b-chat": { successed: true, isOpen: true, organization: "Qwen" },
  "qwen1.5-32b-chat": { successed: true, isOpen: true, organization: "Qwen" },
  "qwen1.5-4b-chat": { successed: true, isOpen: true, organization: "Qwen" },
  "qwen1.5-72b-chat": { successed: true, isOpen: true, organization: "Qwen" },
  "qwen1.5-7b-chat": { successed: true, isOpen: true, organization: "Qwen" },
  "qwen2-72b-instruct": { price: 0.34 + 2 * 0.39, isOpen: true, organization: "Qwen" },
  "qwen2-vl-72b": { isOpen: true, organization: "Qwen" },
  "qwen2-vl-7b-instruct": { isOpen: true, organization: "Qwen" },
  "qwen2.5-72b-instruct": { price: 0.23 + 2 * 0.4, isOpen: true, organization: "Qwen" },
  "qwen2.5-coder-32b-instruct": { price: 0.07 + 2 * 0.16, isOpen: true, organization: "Qwen" },
  "qwen2.5-plus-1127": { price: 3 + 2 * 9, organization: "Qwen" },
  "qwq-32b-preview": { price: 0.12 + 2 * 0.18, isOpen: true, organization: "Qwen" },
  "reka-core-20240501": { successed: true, organization: "Reka AI" },
  "reka-core-20240722": { successed: true, organization: "Reka AI" },
  "reka-core-20240904": { organization: "Reka AI" },
  "reka-flash-20240722": { successed: true, organization: "Reka AI" },
  "reka-flash-20240904": { organization: "Reka AI" },
  "reka-flash-21b-20240226": { organization: "Reka AI" },
  "reka-flash-21b-20240226-online": { organization: "Reka AI" },
  "reka-flash-preview-20240611": { successed: true, organization: "Reka AI" },
  "RWKV-4-Raven-14B": { isOpen: true },
  "snowflake-arctic-instruct": { isOpen: true },
  "stablelm-tuned-alpha-7b": { isOpen: true },
  "starling-lm-7b-alpha": { isOpen: true },
  "starling-lm-7b-beta": { isOpen: true },
  "stripedhyena-nous-7b": { isOpen: true },
  "vicuna-13b": { isOpen: true },
  "vicuna-33b": { isOpen: true },
  "vicuna-7b": { isOpen: true },
  "wizardlm-13b": { isOpen: true },
  "wizardlm-70b": { isOpen: true },
  "yi-1.5-34b-chat": { isOpen: true, organization: "01" },
  "yi-34b-chat": { isOpen: true, organization: "01" },
  "yi-large": { organization: "01" },
  "yi-large-preview": { organization: "01" },
  "yi-lightning": { organization: "01" },
  "yi-lightning-lite": { organization: "01" },
  "zephyr-7b-alpha": { isOpen: true },
  "zephyr-7b-beta": { isOpen: true },
  "zephyr-orpo-141b-A35b-v0.1": { isOpen: true },
} as const;
