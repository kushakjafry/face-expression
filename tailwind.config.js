module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "face-purple": "#5267DF",
        "face-red": "#FA5959",
        "face-blue": "#242A45",
        "face-grey": "#9194A2",
        "face-white": "#f7f7f7",
      },
    },
    fontFamily: {
      Poppins: ["Poppins", "sans-serif"],
    },
    container: {
      center: true,
      padding: "1rem",
      screens: {
        lg: "1124px",
        xl: "1124px",
        "2xl": "1124px",
      },
    },
  },
  plugins: [],
};
