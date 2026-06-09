import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { useCoffeeStore } from '@/store/useCoffeeStore';
import { ingredients } from '@/data/ingredients';

type IngredientType = 'base' | 'flavor' | 'milk' | 'topping';

interface SelectorProps {
  label: string;
  type: IngredientType;
  currentValue: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

function IngredientSelector({ label, currentValue, options, onChange, disabled }: SelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3 bg-white border-2 border-amber-200 rounded-xl text-left flex items-center justify-between hover:border-amber-400 transition-all duration-200 group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex-1 min-w-0">
          <div className="text-xs text-amber-600 mb-0.5">{label}</div>
          <div className="text-sm font-medium text-amber-900 truncate">{currentValue}</div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-amber-500 flex-shrink-0 ml-2" />
        ) : (
          <ChevronDown className="w-5 h-5 text-amber-500 group-hover:text-amber-600 flex-shrink-0 ml-2" />
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-amber-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-amber-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  option === currentValue ? 'bg-amber-100 text-amber-900 font-medium' : 'text-amber-800'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function IngredientEditor() {
  const {
    currentCard,
    updateBase,
    updateFlavor,
    updateMilk,
    updateTopping,
    addFlavor,
    removeFlavor,
    isGenerating,
  } = useCoffeeStore();

  if (!currentCard) return null;

  const { recipe } = currentCard;

  return (
    <div className="w-full bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-amber-100 p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">✏️</span>
        <h3 className="font-semibold text-amber-900">调整配料</h3>
        <span className="text-xs text-amber-500 ml-auto">改完再收藏哦</span>
      </div>

      <div className="space-y-3">
        <IngredientSelector
          label="☕ 基底"
          type="base"
          currentValue={recipe.base}
          options={ingredients.bases}
          onChange={updateBase}
          disabled={isGenerating}
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
          <span className="text-xs text-amber-600 px-1">🍯 风味 ({recipe.flavors.length}/5)</span>
          <button
            onClick={addFlavor}
            disabled={recipe.flavors.length >= 5 || isGenerating}
            className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加风味
          </button>
        </div>
        <div className="space-y-2">
          {recipe.flavors.map((flavor, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <IngredientSelector
                  label={`风味 ${index + 1}`}
                  type="flavor"
                  currentValue={flavor}
                  options={ingredients.flavors.filter(f => !recipe.flavors.includes(f) || f === flavor)}
                  onChange={(value) => updateFlavor(index, value)}
                  disabled={isGenerating}
                />
              </div>
              {recipe.flavors.length > 2 && (
                <button
                  onClick={() => removeFlavor(index)}
                  disabled={isGenerating}
                  className="p-2 text-amber-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
        </div>

        <IngredientSelector
          label="🥛 奶类"
          type="milk"
          currentValue={recipe.milk}
          options={ingredients.milks}
          onChange={updateMilk}
          disabled={isGenerating}
        />

        <IngredientSelector
          label="✨ 装饰"
          type="topping"
          currentValue={recipe.topping}
          options={ingredients.toppings}
          onChange={updateTopping}
          disabled={isGenerating}
        />
      </div>
    </div>
  );
}
