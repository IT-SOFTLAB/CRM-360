/**
 * Base structure for every AI Tool.
 *
 * Each tool should export an object like:
 *
 * {
 *   name: "searchLead",
 *   description: "Search CRM leads",
 *   parameters: {
 *      leadId: {
 *          type: "number",
 *          description: "Lead ID",
 *          required: true
 *      }
 *   },
 *   execute: async (args) => {}
 * }
 */

module.exports = {};