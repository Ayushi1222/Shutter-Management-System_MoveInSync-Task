const Route = require('../models/Route');
const Stop = require('../models/Stop');

/**
 * Find optimal routes between two stops
 * @param {String} startStopId - Starting stop ID
 * @param {String} endStopId - Destination stop ID
 * @param {Object} preferences - User preferences for route optimization
 * @returns {Array} - Array of possible routes sorted by optimization criteria
 */
const findOptimalRoutes = async (startStopId, endStopId, preferences = {}) => {
  try {
    const { 
      prioritizeFast = true, 
      maxTransfers = 1,
      avoidCrowded = false,
      lowCost = false
    } = preferences;
    
    // Get all routes that contain both stops
    const directRoutes = await Route.find({
      stops: { $all: [startStopId, endStopId] }
    }).populate('stops');
    
    // Get routes that contain the start stop
    const startRoutes = await Route.find({
      stops: startStopId,
      _id: { $nin: directRoutes.map(route => route._id) }
    }).populate('stops');
    
    // Get routes that contain the end stop
    const endRoutes = await Route.find({
      stops: endStopId,
      _id: { $nin: directRoutes.map(route => route._id) }
    }).populate('stops');
    
    const directOptions = directRoutes.map(route => {
      const startIndex = route.stops.findIndex(stop => stop._id.toString() === startStopId);
      const endIndex = route.stops.findIndex(stop => stop._id.toString() === endStopId);
      
      const isForward = startIndex < endIndex;
      const stopSequence = isForward 
        ? route.stops.slice(startIndex, endIndex + 1)
        : route.stops.slice(endIndex, startIndex + 1).reverse();
      
      const estimatedTime = calculateEstimatedTime(stopSequence, route.peakTimes);
      
      return {
        type: 'direct',
        route: route,
        stops: stopSequence,
        transfers: 0,
        estimatedTime,
        cost: calculateCost(stopSequence.length, false),
        crowdLevel: route.crowdLevel || 'medium'
      };
    });
    
    const transferOptions = [];
    
    if (maxTransfers > 0) {
      for (const startRoute of startRoutes) {
        for (const endRoute of endRoutes) {
          const transferStops = startRoute.stops.filter(startStop => 
            endRoute.stops.some(endStop => endStop._id.toString() === startStop._id.toString())
          );
          
          for (const transferStop of transferStops) {
            const transferStopId = transferStop._id.toString();
            
            if (transferStopId === startStopId || transferStopId === endStopId) continue;
            
            const startRouteStartIndex = startRoute.stops.findIndex(stop => stop._id.toString() === startStopId);
            const startRouteTransferIndex = startRoute.stops.findIndex(stop => stop._id.toString() === transferStopId);
            const isFirstLegForward = startRouteStartIndex < startRouteTransferIndex;
            const firstLegStops = isFirstLegForward
              ? startRoute.stops.slice(startRouteStartIndex, startRouteTransferIndex + 1)
              : startRoute.stops.slice(startRouteTransferIndex, startRouteStartIndex + 1).reverse();
            
            const endRouteTransferIndex = endRoute.stops.findIndex(stop => stop._id.toString() === transferStopId);
            const endRouteEndIndex = endRoute.stops.findIndex(stop => stop._id.toString() === endStopId);
            const isSecondLegForward = endRouteTransferIndex < endRouteEndIndex;
            const secondLegStops = isSecondLegForward
              ? endRoute.stops.slice(endRouteTransferIndex, endRouteEndIndex + 1)
              : endRoute.stops.slice(endRouteEndIndex, endRouteTransferIndex + 1).reverse();
            
            const firstLegTime = calculateEstimatedTime(firstLegStops, startRoute.peakTimes);
            const secondLegTime = calculateEstimatedTime(secondLegStops, endRoute.peakTimes);
            const transferWaitTime = estimateTransferWaitTime(startRoute, endRoute, transferStopId);
            const totalTime = firstLegTime + transferWaitTime + secondLegTime;
            
            const totalCost = calculateCost(firstLegStops.length, false) + 
                              calculateCost(secondLegStops.length - 1, true); // -1 to avoid counting transfer stop twice
            
            transferOptions.push({
              type: 'transfer',
              routes: [startRoute, endRoute],
              stops: [...firstLegStops, ...secondLegStops.slice(1)], // Remove duplicate transfer stop
              transferStops: [transferStop],
              transfers: 1,
              estimatedTime: totalTime,
              transferWaitTime,
              cost: totalCost,
              crowdLevel: Math.max(startRoute.crowdLevel || 2, endRoute.crowdLevel || 2) // 1=low, 2=medium, 3=high
            });
          }
        }
      }
    }
    
    const allOptions = [...directOptions, ...transferOptions];
    
    // Sort based on preferences
    return sortRouteOptions(allOptions, preferences);
  } catch (error) {
    console.error('Error finding optimal routes:', error);
    throw error;
  }
};

/**
 * Calculate estimated travel time between stops
 * @param {Array} stops - Sequence of stops
 * @param {Object} peakTimes - Peak time information
 * @returns {Number} - Estimated time in minutes
 */
const calculateEstimatedTime = (stops, peakTimes = {}) => {
  const baseTime = (stops.length - 1) * 3;
  

  const now = new Date();
  const hour = now.getHours();
  const isPeakTime = (peakTimes.morning && (hour >= 7 && hour <= 9)) || 
                    (peakTimes.evening && (hour >= 16 && hour <= 18));

  return isPeakTime ? baseTime * 1.25 : baseTime;
};

/**
 * Estimate waiting time for transfers
 * @param {Object} fromRoute - Starting route
 * @param {Object} toRoute - Destination route
 * @param {String} transferStopId - Transfer stop ID
 * @returns {Number} - Estimated wait time in minutes
 */
const estimateTransferWaitTime = (fromRoute, toRoute, transferStopId) => {

  const defaultFrequency = 15;
  
  const toRouteFrequency = toRoute.frequency || defaultFrequency;
  
  return toRouteFrequency / 2;
};

/**
 * Calculate trip cost in points
 * @param {Number} stopCount - Number of stops in the journey
 * @param {Boolean} isTransfer - Whether this is a transfer leg
 * @returns {Number} - Cost in points
 */
const calculateCost = (stopCount, isTransfer) => {
  // Base cost is 2 points + 0.5 points per stop
  const baseCost = 2 + (stopCount - 1) * 0.5;
  
  // Transfers get a 20% discount
  return isTransfer ? baseCost * 0.8 : baseCost;
};

/**
 * Sort route options based on user preferences
 * @param {Array} options - Route options
 * @param {Object} preferences - User preferences
 * @returns {Array} - Sorted route options
 */
const sortRouteOptions = (options, preferences) => {
  const {
    prioritizeFast = true,
    avoidCrowded = false,
    lowCost = false
  } = preferences;
  
  return options.sort((a, b) => {
    // Primary sorting criteria
    if (prioritizeFast) {
      if (a.estimatedTime !== b.estimatedTime) {
        return a.estimatedTime - b.estimatedTime;
      }
    }
    
    // Secondary sorting criteria
    if (avoidCrowded) {
      const crowdLevelA = typeof a.crowdLevel === 'string' 
        ? {'low': 1, 'medium': 2, 'high': 3}[a.crowdLevel] 
        : a.crowdLevel;
      const crowdLevelB = typeof b.crowdLevel === 'string'
        ? {'low': 1, 'medium': 2, 'high': 3}[b.crowdLevel]
        : b.crowdLevel;
        
      if (crowdLevelA !== crowdLevelB) {
        return crowdLevelA - crowdLevelB;
      }
    }
    
    // Third sorting criteria
    if (lowCost) {
      if (a.cost !== b.cost) {
        return a.cost - b.cost;
      }
    }
    
    return a.transfers - b.transfers;
  });
};

module.exports = { findOptimalRoutes };