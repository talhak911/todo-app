// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // adjust as needed
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        "slide-up": {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        spin: {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        spin: "spin 1s linear infinite",
      },
    },
  },
  plugins: [
    function ({ addComponents }: { addComponents: any }) {
      addComponents({
        ".glass-card": {
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(10px)",
          borderRadius: "1rem",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
        },
        ".input": {
          width: "100%",
          padding: "0.5rem 0.75rem",
          borderRadius: "0.375rem",
          border: "1px solid #d1d5db",
          outline: "none",
          fontSize: "0.875rem",
          "&:focus": {
            borderColor: "#8b5cf6",
            boxShadow: "0 0 0 3px rgba(139, 92, 246, 0.3)",
          },
        },
        ".btn-primary": {
          backgroundColor: "#8b5cf6",
          color: "white",
          fontWeight: "500",
          borderRadius: "0.375rem",
          padding: "0.5rem 1rem",
          transition: "background-color 0.2s",
          "&:hover": {
            backgroundColor: "#7c3aed",
          },
          "&:disabled": {
            backgroundColor: "#c4b5fd",
            cursor: "not-allowed",
          },
        },
        ".spinner": {
          border: "2px solid transparent",
          borderTopColor: "white",
          borderRadius: "50%",
          width: "1rem",
          height: "1rem",
          animation: "spin 1s linear infinite",
        },
      });
    },
  ],
};
