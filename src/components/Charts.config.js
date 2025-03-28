export const options = {
  chart: {
    height: 350,
    type: 'line',
    zoom: {
      enabled: false
    }
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'straight'
  },
  title: {
    text: "Saucy's Swap History",
    align: 'left'
  },
  grid: {
    row: {
      
      // takes an array which will be repeated on columns
      colors: ['#f3f3f3', 'transparent'], 
      opacity: 0.5
    },
  }
}

// Default placeholder series 
export const series = [{
  data: [10, 41, 35, 51, 49, 62, 69, 91, 148]
}]
