import axios from "axios";

/**
 * ====================================
 * SEARCH API TEST SCRIPT
 * ====================================
 *
 * Tests all search endpoints to ensure they're working correctly.
 * Run this after starting the server.
 */

const BASE_URL = "http://localhost:8000/api/v1";
const TEST_TOKEN = "your-jwt-token-here"; // Replace with actual token

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${TEST_TOKEN}`,
    "Content-Type": "application/json",
  },
});

const testSearchAPI = async () => {
  console.log("🧪 Testing Search API Endpoints...\n");

  try {
    // Test 1: Global Search
    console.log("1️⃣ Testing Global Search...");
    try {
      const globalResponse = await api.get(
        "/search/global?q=test&type=all&page=1&limit=10"
      );
      console.log(
        `   ✅ Global search: ${globalResponse.status} - ${globalResponse.data.message}`
      );
      console.log(
        `   📊 Results: ${JSON.stringify(globalResponse.data.data.counts)}`
      );
    } catch (error) {
      console.log(
        `   ❌ Global search failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`
      );
    }

    // Test 2: User Search
    console.log("\n2️⃣ Testing User Search...");
    try {
      const userResponse = await api.get(
        "/search/users?q=tamim&page=1&limit=5"
      );
      console.log(
        `   ✅ User search: ${userResponse.status} - ${userResponse.data.message}`
      );
      console.log(
        `   👥 Found: ${userResponse.data.data.users?.length || 0} users`
      );
    } catch (error) {
      console.log(
        `   ❌ User search failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`
      );
    }

    // Test 3: Post Search
    console.log("\n3️⃣ Testing Post Search...");
    try {
      const postResponse = await api.get(
        "/search/posts?q=programming&page=1&limit=5"
      );
      console.log(
        `   ✅ Post search: ${postResponse.status} - ${postResponse.data.message}`
      );
      console.log(
        `   📝 Found: ${postResponse.data.data.posts?.length || 0} posts`
      );
    } catch (error) {
      console.log(
        `   ❌ Post search failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`
      );
    }

    // Test 4: Group Search
    console.log("\n4️⃣ Testing Group Search...");
    try {
      const groupResponse = await api.get(
        "/search/groups?q=computer&page=1&limit=5"
      );
      console.log(
        `   ✅ Group search: ${groupResponse.status} - ${groupResponse.data.message}`
      );
      console.log(
        `   👥 Found: ${groupResponse.data.data.groups?.length || 0} groups`
      );
    } catch (error) {
      console.log(
        `   ❌ Group search failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`
      );
    }

    // Test 5: Institution Search
    console.log("\n5️⃣ Testing Institution Search...");
    try {
      const instResponse = await api.get(
        "/search/institutions?q=university&page=1&limit=5"
      );
      console.log(
        `   ✅ Institution search: ${instResponse.status} - ${instResponse.data.message}`
      );
      console.log(
        `   🏫 Found: ${instResponse.data.data.institutions?.length || 0} institutions`
      );
    } catch (error) {
      console.log(
        `   ❌ Institution search failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`
      );
    }

    // Test 6: Department Search
    console.log("\n6️⃣ Testing Department Search...");
    try {
      const deptResponse = await api.get(
        "/search/departments?q=cse&page=1&limit=5"
      );
      console.log(
        `   ✅ Department search: ${deptResponse.status} - ${deptResponse.data.message}`
      );
      console.log(
        `   🏛️ Found: ${deptResponse.data.data.departments?.length || 0} departments`
      );
    } catch (error) {
      console.log(
        `   ❌ Department search failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`
      );
    }

    // Test 7: Comment Search
    console.log("\n7️⃣ Testing Comment Search...");
    try {
      const commentResponse = await api.get(
        "/search/comments?q=good&page=1&limit=5"
      );
      console.log(
        `   ✅ Comment search: ${commentResponse.status} - ${commentResponse.data.message}`
      );
      console.log(
        `   💬 Found: ${commentResponse.data.data.comments?.length || 0} comments`
      );
    } catch (error) {
      console.log(
        `   ❌ Comment search failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`
      );
    }

    // Test 8: Search Suggestions
    console.log("\n8️⃣ Testing Search Suggestions...");
    try {
      const suggestResponse = await api.get("/search/suggestions?q=ta");
      console.log(
        `   ✅ Suggestions: ${suggestResponse.status} - ${suggestResponse.data.message}`
      );
      console.log(
        `   💡 Found: ${suggestResponse.data.data?.length || 0} suggestions`
      );
    } catch (error) {
      console.log(
        `   ❌ Suggestions failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`
      );
    }

    // Test 9: Error Handling - Short Query
    console.log("\n9️⃣ Testing Error Handling (Short Query)...");
    try {
      const errorResponse = await api.get("/search/global?q=a");
      console.log(`   ❌ Should have failed but got: ${errorResponse.status}`);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log(
          `   ✅ Error handling works: ${error.response.status} - ${error.response.data.message}`
        );
      } else {
        console.log(
          `   ❌ Unexpected error: ${error.response?.status} - ${error.message}`
        );
      }
    }

    // Test 10: Error Handling - Invalid Type
    console.log("\n🔟 Testing Error Handling (Invalid Type)...");
    try {
      const errorResponse = await api.get("/search/global?q=test&type=invalid");
      console.log(`   ❌ Should have failed but got: ${errorResponse.status}`);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log(
          `   ✅ Error handling works: ${error.response.status} - ${error.response.data.message}`
        );
      } else {
        console.log(
          `   ❌ Unexpected error: ${error.response?.status} - ${error.message}`
        );
      }
    }

    console.log("\n🎉 Search API testing completed!");
  } catch (error) {
    console.error("❌ Test setup failed:", error.message);
    console.log("\n💡 Make sure:");
    console.log("   1. Server is running on http://localhost:8000");
    console.log("   2. Replace TEST_TOKEN with a valid JWT token");
    console.log("   3. Database has some sample data");
  }
};

// Instructions for getting a test token
console.log("📋 To run this test:");
console.log("1. Start your server: npm run dev");
console.log("2. Login via API or frontend to get a JWT token");
console.log("3. Replace TEST_TOKEN in this file with your token");
console.log("4. Run: node test-search-api.js\n");

// Uncomment the line below after setting up the token
// testSearchAPI();
