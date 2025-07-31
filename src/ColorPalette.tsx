import React from "react";

const ColorPalette = () => {
  const colorOptions = [a
    {
      name: "Energetic Coral",
      primary: "#FF6B6B",
      light: "#FFE0E0",
      description: "Vibrant and empowering, great for CTAs and highlights",
    },
    {
      name: "Confident Teal",
      primary: "#20B2AA",
      light: "#E0F7F5",
      description:
        "Professional yet approachable, excellent for trust-building",
    },
    {
      name: "Bold Orange",
      primary: "#FF8C42",
      light: "#FFF0E6",
      description:
        "High energy and attention-grabbing, perfect for action elements",
    },
    {
      name: "Empowering Purple",
      primary: "#8B5FBF",
      light: "#F0E6FF",
      description: "Strong and sophisticated, great for premium services",
    },
    {
      name: "Fresh Green",
      primary: "#4ECDC4",
      light: "#E6FFFE",
      description: "Growth and positivity focused, welcoming for new students",
    },
  ];

  const baseColors = {
    navy: "#2C3E50",
    yellow: "#F1C40F",
    white: "#FFFFFF",
    lightGray: "#F8F9FA",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Streetwise Self Defense - Color Palette Options
        </h1>

        {/* Current Base Colors */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Current Base Colors</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div
                className="w-20 h-20 rounded-lg mx-auto mb-2 border"
                style={{ backgroundColor: baseColors.navy }}
              ></div>
              <p className="text-sm font-medium">Navy</p>
              <p className="text-xs text-gray-500">{baseColors.navy}</p>
            </div>
            <div className="text-center">
              <div
                className="w-20 h-20 rounded-lg mx-auto mb-2 border"
                style={{ backgroundColor: baseColors.yellow }}
              ></div>
              <p className="text-sm font-medium">Yellow</p>
              <p className="text-xs text-gray-500">{baseColors.yellow}</p>
            </div>
            <div className="text-center">
              <div
                className="w-20 h-20 rounded-lg mx-auto mb-2 border"
                style={{ backgroundColor: baseColors.white }}
              ></div>
              <p className="text-sm font-medium">White</p>
              <p className="text-xs text-gray-500">{baseColors.white}</p>
            </div>
            <div className="text-center">
              <div
                className="w-20 h-20 rounded-lg mx-auto mb-2 border"
                style={{ backgroundColor: baseColors.lightGray }}
              ></div>
              <p className="text-sm font-medium">Light Gray</p>
              <p className="text-xs text-gray-500">{baseColors.lightGray}</p>
            </div>
          </div>
        </div>

        {/* Accent Color Options */}
        <div>
          <h2 className="text-xl font-semibold mb-6">Accent Color Options</h2>
          <div className="space-y-8">
            {colorOptions.map((option, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 shadow-sm border"
              >
                <h3 className="text-lg font-semibold mb-4">{option.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Color Swatches */}
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div
                        className="w-16 h-16 rounded-lg border"
                        style={{ backgroundColor: option.primary }}
                      ></div>
                      <p className="text-xs mt-1">Primary</p>
                      <p className="text-xs text-gray-500">{option.primary}</p>
                    </div>
                    <div className="text-center">
                      <div
                        className="w-16 h-16 rounded-lg border"
                        style={{ backgroundColor: option.light }}
                      ></div>
                      <p className="text-xs mt-1">Light</p>
                      <p className="text-xs text-gray-500">{option.light}</p>
                    </div>
                  </div>

                  {/* Sample Usage */}
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      {option.description}
                    </p>
                    <div className="flex gap-2">
                      <button
                        className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                        style={{ backgroundColor: option.primary }}
                      >
                        Book Now
                      </button>
                      <button
                        className="px-4 py-2 rounded-lg text-sm font-medium border"
                        style={{
                          backgroundColor: option.light,
                          color: option.primary,
                          borderColor: option.primary,
                        }}
                      >
                        Learn More
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sample with Navy/Yellow */}
                <div
                  className="mt-4 p-4 rounded-lg"
                  style={{ backgroundColor: baseColors.lightGray }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: baseColors.navy }}
                    ></div>
                    <div
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: baseColors.yellow }}
                    ></div>
                    <div
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: option.primary }}
                    ></div>
                    <span className="text-sm text-gray-600">
                      Combined palette preview
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 p-6 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Recommendation</h3>
          <p className="text-blue-800 text-sm">
            For a self-defense business, I'd recommend either{" "}
            <strong>Confident Teal</strong> or <strong>Energetic Coral</strong>.
            Teal conveys trust and professionalism (great for corporate
            clients), while coral is empowering and action-oriented (perfect for
            motivating personal safety action).
          </p>
        </div>
      </div>
    </div>
  );
};

export default ColorPalette;
