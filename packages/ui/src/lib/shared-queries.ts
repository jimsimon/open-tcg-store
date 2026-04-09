import { TypedDocumentString } from '../graphql/graphql';

export interface SupportedGame {
  categoryId: number;
  name: string;
  displayName: string;
}

export const GetSupportedGamesQuery = new TypedDocumentString(`
  query GetSupportedGames {
    getSupportedGames {
      categoryId
      name
      displayName
    }
  }
`) as unknown as TypedDocumentString<
  {
    getSupportedGames: Array<SupportedGame>;
  },
  Record<string, never>
>;
