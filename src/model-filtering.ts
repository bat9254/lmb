import {
  type FilterStrategy,
  type PriceRange,
  type ModelMetadata,
  modelMetadata,
  getPriceRange,
} from "./model-metadata";

function shouldShowModel(
  model: string,
  metadata: ModelMetadata,
  strategy: FilterStrategy,
  allModels: Array<{ name: string; rating: number }>
): boolean {
  switch (strategy) {
    case "showAll":
      return true;
    case "hideDeprecated":
      return !metadata.deprecated;
    case "hideOld": {
      if (metadata.deprecated) return false;
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
        (m) => modelMetadata[m.name]?.organization === metadata.organization
      );
      const bestOrgModel = orgModels.reduce((best, current) =>
        current.rating > best.rating ? current : best
      );
      return bestOrgModel.name === model;
  }
}

export interface ModelData {
  name: string;
  rating: number;
  ciLow: number;
  ciHigh: number;
  rank: number;
}

export function filterModels(
  board: Record<string, Record<string, any>>,
  categoryName: string,
  searches: string[],
  showOpenOnly: boolean,
  filterStrategy: FilterStrategy,
  selectedPriceRanges: Set<PriceRange>
): ModelData[] {
  let models: ModelData[] = [];

  // Build initial model data
  for (const [name, rating] of Object.entries(
    board[categoryName]?.elo_rating_final || {}
  )) {
    const samples = board[categoryName]?.bootstrap_df?.[name] || {};
    const sampleValues = Object.values(samples) as number[];

    let ciLow = 0,
      ciHigh = 0;
    if (sampleValues.length > 0) {
      const sorted = [...sampleValues].sort((a, b) => a - b);
      const lowIndex = Math.floor(sorted.length * 0.025);
      const highIndex = Math.floor(sorted.length * 0.975);
      ciLow = Number(sorted[lowIndex]) || Number(rating);
      ciHigh = Number(sorted[highIndex]) || Number(rating);
    }

    models.push({
      name,
      rating: Number(rating),
      ciLow,
      ciHigh,
      rank: 0,
    });
  }

  // Sort and assign ranks
  models.sort((a, b) => b.rating - a.rating);
  let rank = 1;
  let ciLow: number | undefined;
  for (const [i, model] of Object.entries(models)) {
    if (!ciLow) {
      ciLow = model.ciLow;
    }
    if (model.ciHigh < ciLow) {
      ciLow = model.ciLow;
      rank = +i + 1;
    }
    model.rank = rank;
  }

  // Apply filters
  models = models.filter((model) => {
    const name = model.name.toLowerCase();
    const tests = searches.filter(Boolean);
    if (tests.length == 0) return true;
    return tests.some((test) => name.includes(test.toLowerCase()));
  });

  if (showOpenOnly) {
    models = models.filter((model) => {
      const metadata = modelMetadata[model.name];
      return metadata?.isOpen == true;
    });
  }

  models = models.filter((model) => {
    if (selectedPriceRanges.size == 0) return true;
    const metadata = modelMetadata[model.name];
    const avgPrice = metadata?.price;
    const priceRange = avgPrice && getPriceRange(avgPrice / 3);
    if (!priceRange) return false;
    return selectedPriceRanges.has(priceRange);
  });

  if (filterStrategy != "showAll") {
    models = models.filter((model) => {
      const metadata = modelMetadata[model.name];
      return (
        !metadata ||
        shouldShowModel(model.name, metadata, filterStrategy, models)
      );
    });
  }

  return models;
}
