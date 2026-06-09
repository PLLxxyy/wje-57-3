import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CardStyle, CoffeeCardData, CoffeeRecipe } from '@/types';
import { generateRecipe } from '@/utils/recipeGenerator';
import { ingredients } from '@/data/ingredients';
import { generateCoffeeName } from '@/utils/nameGenerator';
import { generateDescription } from '@/utils/descriptionGenerator';
import { generateShop } from '@/utils/shopGenerator';

interface CoffeeState {
  currentCard: CoffeeCardData | null;
  favorites: CoffeeRecipe[];
  history: CoffeeRecipe[];
  currentStyle: CardStyle;
  isGenerating: boolean;
  
  generateNewRecipe: () => void;
  toggleFavorite: (recipeId: string) => void;
  setCurrentStyle: (style: CardStyle) => void;
  clearHistory: () => void;
  removeFavorite: (recipeId: string) => void;
  loadRecipeFromHistory: (recipe: CoffeeRecipe) => void;
  updateBase: (base: string) => void;
  updateFlavor: (index: number, flavor: string) => void;
  updateMilk: (milk: string) => void;
  updateTopping: (topping: string) => void;
  addFlavor: () => void;
  removeFlavor: (index: number) => void;
}

function createRecipeUpdater(
  state: CoffeeState,
  mutator: (recipe: CoffeeRecipe) => Partial<CoffeeRecipe> | null,
  regenerateName = true
): Partial<CoffeeState> | undefined {
  if (!state.currentCard) return undefined;
  const recipe = state.currentCard.recipe;
  const mutated = mutator(recipe);
  if (mutated === null) return undefined;
  const mergedRecipe = { ...recipe, ...mutated };
  const newName = regenerateName
    ? generateCoffeeName(mergedRecipe.flavors, mergedRecipe.base)
    : recipe.name;
  const newDescription = generateDescription(
    mergedRecipe.base,
    mergedRecipe.flavors,
    mergedRecipe.topping,
    mergedRecipe.milk
  );
  const updatedRecipe = { ...mergedRecipe, name: newName, description: newDescription };
  return {
    currentCard: { ...state.currentCard, recipe: updatedRecipe },
    history: state.history.map(h => (h.id === recipe.id ? updatedRecipe : h)),
  };
}

export const useCoffeeStore = create<CoffeeState>()(
  persist(
    (set, get) => ({
      currentCard: null,
      favorites: [],
      history: [],
      currentStyle: 'vintage',
      isGenerating: false,

      generateNewRecipe: () => {
        set({ isGenerating: true });
        
        setTimeout(() => {
          const style = get().currentStyle;
          const baseRecipe = generateRecipe(style);
          const name = generateCoffeeName(baseRecipe.flavors, baseRecipe.base);
          const description = generateDescription(
            baseRecipe.base,
            baseRecipe.flavors,
            baseRecipe.topping,
            baseRecipe.milk
          );
          const shop = generateShop();

          const recipe: CoffeeRecipe = {
            ...baseRecipe,
            name,
            description,
          };

          const cardData: CoffeeCardData = {
            recipe,
            shop,
            style,
          };

          set((state) => ({
            currentCard: cardData,
            history: [recipe, ...state.history].slice(0, 100),
            isGenerating: false,
          }));
        }, 600);
      },

      toggleFavorite: (recipeId: string) => {
        set((state) => {
          const isCurrentlyFavorite = state.favorites.some(f => f.id === recipeId);
          let newFavorites: CoffeeRecipe[];
          
          if (isCurrentlyFavorite) {
            newFavorites = state.favorites.filter(f => f.id !== recipeId);
          } else {
            const recipeToAdd = state.currentCard?.recipe 
              || state.history.find(h => h.id === recipeId);
            if (recipeToAdd) {
              newFavorites = [{ ...recipeToAdd, isFavorite: true }, ...state.favorites];
            } else {
              newFavorites = state.favorites;
            }
          }

          const updatedHistory = state.history.map(h => 
            h.id === recipeId ? { ...h, isFavorite: !isCurrentlyFavorite } : h
          );

          let updatedCurrentCard = state.currentCard;
          if (state.currentCard?.recipe.id === recipeId) {
            updatedCurrentCard = {
              ...state.currentCard,
              recipe: {
                ...state.currentCard.recipe,
                isFavorite: !isCurrentlyFavorite,
              },
            };
          }

          return {
            favorites: newFavorites,
            history: updatedHistory,
            currentCard: updatedCurrentCard,
          };
        });
      },

      setCurrentStyle: (style: CardStyle) => {
        set((state) => ({
          currentStyle: style,
          currentCard: state.currentCard
            ? { ...state.currentCard, style }
            : null,
        }));
      },

      clearHistory: () => {
        set({ history: [] });
      },

      removeFavorite: (recipeId: string) => {
        set((state) => ({
          favorites: state.favorites.filter(f => f.id !== recipeId),
          history: state.history.map(h => 
            h.id === recipeId ? { ...h, isFavorite: false } : h
          ),
        }));
      },

      loadRecipeFromHistory: (recipe: CoffeeRecipe) => {
        const shop = generateShop();
        set({
          currentCard: {
            recipe,
            shop,
            style: recipe.style,
          },
          currentStyle: recipe.style,
        });
      },

      updateBase: (base: string) => {
        set((state) =>
          createRecipeUpdater(state, () => ({ base }))
        );
      },

      updateFlavor: (index: number, flavor: string) => {
        set((state) =>
          createRecipeUpdater(state, (recipe) => {
            const newFlavors = [...recipe.flavors];
            newFlavors[index] = flavor;
            return { flavors: newFlavors };
          })
        );
      },

      updateMilk: (milk: string) => {
        set((state) =>
          createRecipeUpdater(state, () => ({ milk }), false)
        );
      },

      updateTopping: (topping: string) => {
        set((state) =>
          createRecipeUpdater(state, () => ({ topping }), false)
        );
      },

      addFlavor: () => {
        set((state) =>
          createRecipeUpdater(state, (recipe) => {
            if (recipe.flavors.length >= 5) return null;
            const availableFlavors = ingredients.flavors.filter(f => !recipe.flavors.includes(f));
            if (availableFlavors.length === 0) return null;
            const randomFlavor = availableFlavors[Math.floor(Math.random() * availableFlavors.length)];
            return { flavors: [...recipe.flavors, randomFlavor] };
          })
        );
      },

      removeFlavor: (index: number) => {
        set((state) =>
          createRecipeUpdater(state, (recipe) => {
            if (recipe.flavors.length <= 2) return null;
            return { flavors: recipe.flavors.filter((_, i) => i !== index) };
          })
        );
      },
    }),
    {
      name: 'coffee-generator-storage',
      partialize: (state) => ({
        favorites: state.favorites,
        history: state.history,
        currentStyle: state.currentStyle,
      }),
    }
  )
);
