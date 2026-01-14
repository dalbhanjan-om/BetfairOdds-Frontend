import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { ChevronDown, ChevronUp } from 'lucide-react'

const Rules = () => {
  const [rules, setRules] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedRules, setExpandedRules] = useState(new Set())

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      setLoading(true)
      const response = await axios.get('http://localhost:5000/rules')
      setRules(response.data)
      setError(null)
    } catch (err) {
      setError('Failed to fetch rules')
      console.error('Error fetching rules:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleRule = (ruleId) => {
    const newExpanded = new Set(expandedRules)
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId)
    } else {
      newExpanded.add(ruleId)
    }
    setExpandedRules(newExpanded)
  }

  if (loading) {
    return <div className="p-4">Loading rules...</div>
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>
  }

  if (!rules || !rules.betRules) {
    return <div className="p-4">No rules found</div>
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Betting Rules</h1>

      <div className="space-y-4">
        {rules.betRules.map((ruleGroup, idx) => (
          <div key={idx} className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-blue-50 p-4 border-b border-gray-300">
              <h2 className="text-lg font-semibold text-gray-800">
                Innings {ruleGroup.innings} | Overs {ruleGroup.oversRange}
              </h2>
              <p className="text-sm text-gray-600">
                {ruleGroup.rules.length} rule{ruleGroup.rules.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Rules List */}
            <div className="divide-y divide-gray-200">
              {ruleGroup.rules.map((rule) => (
                <div key={rule.ruleId} className="bg-white">
                  <button
                    onClick={() => toggleRule(rule.ruleId)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-800">{rule.ruleId}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Triggers: {rule.triggerBet.betType} bet on "{rule.triggerBet.marketName}" (Stake: ${rule.triggerBet.stake})
                      </p>
                    </div>
                    <div className="ml-2">
                      {expandedRules.has(rule.ruleId) ? (
                        <ChevronUp size={20} className="text-blue-600" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {expandedRules.has(rule.ruleId) && (
                    <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
                      <div className="mt-3">
                        <h4 className="font-semibold text-gray-700 mb-2">Condition:</h4>
                        <div className="bg-white p-3 rounded border border-gray-200 font-mono text-sm text-gray-700 overflow-auto max-h-48">
                          {typeof rule.condition === 'object' ? (
                            <pre>{JSON.stringify(rule.condition, null, 2)}</pre>
                          ) : (
                            <span>{rule.condition}</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3">
                        <h4 className="font-semibold text-gray-700 mb-2">Trigger Bet:</h4>
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-sm">
                            <span className="font-semibold">Type:</span> {rule.triggerBet.betType}
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">Market:</span> {rule.triggerBet.marketName}
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">Stake:</span> ${rule.triggerBet.stake}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Rules