import { frameworks } from "./frameworks";
import { industries } from "./industries";
import type { FrameworkGenerator, GeneratedSnippet, IndustryPreset, LanguageId } from "./types";

export interface GenerateParams {
  frameworkId: string;
  industryId: string;
  language: LanguageId;
  useUltrafastGrid: boolean;
}

/**
 * The heart of the app: look up the chosen framework + industry in their
 * registries and produce a snippet. Adding a framework or industry never
 * requires touching this function.
 */
export function generateSnippet(params: GenerateParams): GeneratedSnippet {
  const framework = frameworks[params.frameworkId];
  const industry = industries[params.industryId];

  if (!framework) throw new Error(`Unknown framework: "${params.frameworkId}"`);
  if (!industry) throw new Error(`Unknown industry: "${params.industryId}"`);

  const language = framework.supportedLanguages.includes(params.language)
    ? params.language
    : framework.supportedLanguages[0];

  return framework.generate({
    language,
    useUltrafastGrid: params.useUltrafastGrid,
    industry,
  });
}

export function listFrameworks(): FrameworkGenerator[] {
  return Object.values(frameworks);
}

export function listIndustries(): IndustryPreset[] {
  return Object.values(industries);
}
